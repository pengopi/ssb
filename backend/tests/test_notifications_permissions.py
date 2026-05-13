"""Backend tests for notifications, permissions (izin), photo upload, and notify-on-event flows.

Iteration 2 features:
- /api/notifications (list, unread-count, mark read, read-all)
- /api/permissions (parent create -> auto-attendance + notify coach/admin; coach approve -> notify parent)
- PUT /api/students/{sid} photo update (parent owner vs other)
- Attendance/Payment/Announcement creation auto-creates notifications
"""
import os
import time
import requests

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://soccer-school-7.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN = {'email': 'admin@ssb.id', 'password': 'admin123'}
COACH = {'email': 'coach@ssb.id', 'password': 'coach123'}
PARENT = {'email': 'parent@ssb.id', 'password': 'parent123'}


def _login(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=30)
    assert r.status_code == 200, f"login {creds['email']}: {r.status_code} {r.text}"
    return r.json()


def _auth(tok):
    return {'Authorization': f'Bearer {tok}'}


import pytest


@pytest.fixture(scope='module')
def tokens():
    return {
        'admin': _login(ADMIN)['token'],
        'coach': _login(COACH)['token'],
        'parent': _login(PARENT),
    }


@pytest.fixture(scope='module')
def parent_token(tokens):
    return tokens['parent']['token']


@pytest.fixture(scope='module')
def parent_user_id(tokens):
    return tokens['parent']['user']['id']


@pytest.fixture(scope='module')
def coach_token(tokens):
    return tokens['coach']


@pytest.fixture(scope='module')
def admin_token(tokens):
    return tokens['admin']


@pytest.fixture(scope='module')
def parent_children(parent_token):
    r = requests.get(f"{API}/students", headers=_auth(parent_token))
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 2
    return data


@pytest.fixture(scope='module')
def all_students(coach_token):
    r = requests.get(f"{API}/students", headers=_auth(coach_token))
    return r.json()


@pytest.fixture(scope='module')
def test_session_id(coach_token):
    r = requests.post(f"{API}/sessions", headers=_auth(coach_token), json={
        'date': '2026-05-01', 'time': '17:00', 'location': 'TEST Field', 'title': 'TEST notif session'
    })
    assert r.status_code == 200
    return r.json()['id']


# --------- NOTIFICATIONS ---------
class TestNotifications:
    def test_list_returns_list(self, coach_token):
        r = requests.get(f"{API}/notifications", headers=_auth(coach_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_unread_count_shape(self, coach_token):
        r = requests.get(f"{API}/notifications/unread-count", headers=_auth(coach_token))
        assert r.status_code == 200
        body = r.json()
        assert 'count' in body
        assert isinstance(body['count'], int)

    def test_read_all_zeroes_count(self, parent_token):
        # mark all read first
        r = requests.post(f"{API}/notifications/read-all", headers=_auth(parent_token))
        assert r.status_code == 200
        c = requests.get(f"{API}/notifications/unread-count", headers=_auth(parent_token)).json()['count']
        assert c == 0, f"after read-all expected 0 unread, got {c}"


# --------- ATTENDANCE -> NOTIFY PARENT ---------
class TestAttendanceNotifiesParent:
    def test_marking_attendance_for_parent_child_creates_notification(self, coach_token, parent_token, parent_children, test_session_id):
        # parent: read-all to clear baseline
        requests.post(f"{API}/notifications/read-all", headers=_auth(parent_token))
        child_id = parent_children[0]['id']
        r = requests.post(f"{API}/attendance", headers=_auth(coach_token), json={
            'session_id': test_session_id, 'student_id': child_id, 'status': 'present'
        })
        assert r.status_code == 200, r.text
        time.sleep(0.5)
        cnt = requests.get(f"{API}/notifications/unread-count", headers=_auth(parent_token)).json()['count']
        assert cnt >= 1, "parent should receive notification when attendance marked for own child"


# --------- PAYMENT -> NOTIFY PARENT ---------
class TestPaymentNotifiesParent:
    def test_payment_creates_parent_notification(self, coach_token, parent_token, parent_children):
        requests.post(f"{API}/notifications/read-all", headers=_auth(parent_token))
        child_id = parent_children[1]['id']
        r = requests.post(f"{API}/payments", headers=_auth(coach_token), json={
            'student_id': child_id, 'month': 6, 'year': 2026, 'amount': 150000.0, 'status': 'paid'
        })
        assert r.status_code == 200, r.text
        time.sleep(0.5)
        cnt = requests.get(f"{API}/notifications/unread-count", headers=_auth(parent_token)).json()['count']
        assert cnt >= 1, "parent should be notified on payment"


# --------- ANNOUNCEMENT -> BROADCAST TO ALL ROLES ---------
class TestAnnouncementBroadcast:
    def test_announcement_broadcasts_to_parent_role(self, coach_token, parent_token):
        requests.post(f"{API}/notifications/read-all", headers=_auth(parent_token))
        r = requests.post(f"{API}/announcements", headers=_auth(coach_token), json={
            'title': 'TEST Broadcast', 'content': 'Hello all'
        })
        assert r.status_code == 200
        time.sleep(0.5)
        cnt = requests.get(f"{API}/notifications/unread-count", headers=_auth(parent_token)).json()['count']
        assert cnt >= 1, "announcement should broadcast to parent role"


# --------- PERMISSIONS ---------
class TestPermissions:
    def test_parent_creates_permission_for_own_child_sick_creates_attendance_sick(
        self, parent_token, parent_children, test_session_id, coach_token
    ):
        # clear coach baseline
        requests.post(f"{API}/notifications/read-all", headers=_auth(coach_token))
        child_id = parent_children[0]['id']
        r = requests.post(f"{API}/permissions", headers=_auth(parent_token), json={
            'student_id': child_id, 'session_id': test_session_id, 'type': 'sick', 'reason': 'TEST demam'
        })
        assert r.status_code == 200, r.text
        body = r.json()
        assert body['status'] == 'pending'
        assert body['student_name'] in ('Andi Pratama', 'Budi Santoso')
        TestPermissions.pid_sick = body['id']

        # verify attendance auto-created as sick
        att = requests.get(f"{API}/attendance/session/{test_session_id}", headers=_auth(coach_token)).json()
        match = [a for a in att if a['student_id'] == child_id]
        assert match, "attendance row should be auto-created"
        assert match[0]['status'] == 'sick'

        # coach should get notification
        time.sleep(0.5)
        cnt = requests.get(f"{API}/notifications/unread-count", headers=_auth(coach_token)).json()['count']
        assert cnt >= 1, "coach should receive permission notification"

    def test_parent_creates_permission_excused_marks_absent(
        self, parent_token, parent_children, coach_token
    ):
        # need a new session to test excused mapping
        sess = requests.post(f"{API}/sessions", headers=_auth(coach_token), json={
            'date': '2026-05-02', 'time': '17:00', 'location': 'TEST', 'title': 'TEST excused'
        }).json()
        sid = sess['id']
        child_id = parent_children[1]['id']
        r = requests.post(f"{API}/permissions", headers=_auth(parent_token), json={
            'student_id': child_id, 'session_id': sid, 'type': 'excused', 'reason': 'TEST acara keluarga'
        })
        assert r.status_code == 200, r.text
        att = requests.get(f"{API}/attendance/session/{sid}", headers=_auth(coach_token)).json()
        match = [a for a in att if a['student_id'] == child_id]
        assert match and match[0]['status'] == 'absent', "excused permission should map to absent attendance"

    def test_parent_cannot_create_for_other_child(self, parent_token, all_students, parent_children, test_session_id):
        parent_ids = {s['id'] for s in parent_children}
        other = next((s for s in all_students if s['id'] not in parent_ids), None)
        assert other, "need at least one non-parent student"
        r = requests.post(f"{API}/permissions", headers=_auth(parent_token), json={
            'student_id': other['id'], 'session_id': test_session_id, 'type': 'sick', 'reason': 'X'
        })
        assert r.status_code == 403

    def test_parent_list_only_own(self, parent_token, parent_children):
        r = requests.get(f"{API}/permissions", headers=_auth(parent_token))
        assert r.status_code == 200
        items = r.json()
        parent_ids = {s['id'] for s in parent_children}
        for it in items:
            assert it['student_id'] in parent_ids

    def test_coach_lists_all(self, coach_token):
        r = requests.get(f"{API}/permissions", headers=_auth(coach_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) >= 1  # we created above

    def test_coach_approve_notifies_parent(self, coach_token, parent_token, parent_user_id):
        pid = getattr(TestPermissions, 'pid_sick', None)
        assert pid, "previous test should have created a permission"
        requests.post(f"{API}/notifications/read-all", headers=_auth(parent_token))
        r = requests.post(f"{API}/permissions/{pid}/approve", headers=_auth(coach_token))
        assert r.status_code == 200
        # verify status changed
        items = requests.get(f"{API}/permissions", headers=_auth(coach_token)).json()
        p = next((x for x in items if x['id'] == pid), None)
        assert p and p['status'] == 'approved'
        # parent should be notified
        time.sleep(0.5)
        cnt = requests.get(f"{API}/notifications/unread-count", headers=_auth(parent_token)).json()['count']
        assert cnt >= 1, "parent should be notified on approval"

    def test_parent_cannot_approve(self, parent_token, coach_token, parent_children, test_session_id):
        # create one as parent, then try approve as parent
        child_id = parent_children[0]['id']
        # create new session for fresh permission
        sess = requests.post(f"{API}/sessions", headers=_auth(coach_token), json={
            'date': '2026-05-03', 'time': '17:00', 'location': 'TEST', 'title': 'TEST forbid'
        }).json()
        p = requests.post(f"{API}/permissions", headers=_auth(parent_token), json={
            'student_id': child_id, 'session_id': sess['id'], 'type': 'sick', 'reason': 'TEST forbid'
        }).json()
        r = requests.post(f"{API}/permissions/{p['id']}/approve", headers=_auth(parent_token))
        assert r.status_code == 403


# --------- STUDENT PHOTO UPDATE ---------
class TestStudentPhotoUpdate:
    PHOTO_DATA = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="

    def test_coach_can_update_any_student_photo(self, coach_token, all_students):
        sid = all_students[0]['id']
        r = requests.put(f"{API}/students/{sid}", headers=_auth(coach_token), json={'photo': self.PHOTO_DATA})
        assert r.status_code == 200, r.text
        assert r.json().get('photo') == self.PHOTO_DATA

    def test_parent_can_update_own_child_photo(self, parent_token, parent_children):
        sid = parent_children[0]['id']
        r = requests.put(f"{API}/students/{sid}", headers=_auth(parent_token), json={'photo': self.PHOTO_DATA})
        assert r.status_code == 200, r.text
        # verify persisted
        g = requests.get(f"{API}/students/{sid}", headers=_auth(parent_token)).json()
        assert g['photo'] == self.PHOTO_DATA

    def test_parent_cannot_update_other_child(self, parent_token, all_students, parent_children):
        parent_ids = {s['id'] for s in parent_children}
        other = next((s for s in all_students if s['id'] not in parent_ids), None)
        assert other
        r = requests.put(f"{API}/students/{other['id']}", headers=_auth(parent_token), json={'photo': self.PHOTO_DATA})
        assert r.status_code == 403
