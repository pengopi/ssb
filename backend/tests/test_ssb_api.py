"""SSB Academy backend regression tests."""
import os
import pytest
import requests
from datetime import datetime

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://soccer-school-7.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN = {'email': 'admin@ssb.id', 'password': 'admin123'}
COACH = {'email': 'coach@ssb.id', 'password': 'coach123'}
PARENT = {'email': 'parent@ssb.id', 'password': 'parent123'}


def _login(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=30)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    return r.json()


def _auth(token):
    return {'Authorization': f'Bearer {token}'}


@pytest.fixture(scope='session')
def admin_token():
    return _login(ADMIN)['token']


@pytest.fixture(scope='session')
def coach_token():
    return _login(COACH)['token']


@pytest.fixture(scope='session')
def parent_token():
    d = _login(PARENT)
    return d['token']


# ---------- AUTH ----------
class TestAuth:
    def test_login_admin_role(self):
        d = _login(ADMIN)
        assert d['user']['role'] == 'admin'
        assert d['token']

    def test_login_coach_role(self):
        d = _login(COACH)
        assert d['user']['role'] == 'coach'

    def test_login_parent_role(self):
        d = _login(PARENT)
        assert d['user']['role'] == 'parent'

    def test_login_invalid_creds(self):
        r = requests.post(f"{API}/auth/login", json={'email': 'admin@ssb.id', 'password': 'wrong'})
        assert r.status_code == 401

    def test_signup_creates_parent(self):
        unique = f"test_{datetime.now().timestamp():.0f}@example.com"
        r = requests.post(f"{API}/auth/signup", json={
            'email': unique, 'password': 'pass1234', 'name': 'TEST New Parent', 'role': 'parent'
        })
        assert r.status_code == 200, r.text
        body = r.json()
        assert body['user']['role'] == 'parent'
        assert body['token']

    def test_me_with_token(self, admin_token):
        r = requests.get(f"{API}/auth/me", headers=_auth(admin_token))
        assert r.status_code == 200
        assert r.json()['role'] == 'admin'

    def test_no_token_returns_401(self):
        for ep in ['/students', '/sessions', '/payments', '/announcements', '/matches', '/stats', '/auth/me']:
            r = requests.get(f"{API}{ep}")
            assert r.status_code in (401, 403), f"{ep} returned {r.status_code}"


# ---------- STUDENTS ----------
class TestStudents:
    def test_list_students_admin(self, admin_token):
        r = requests.get(f"{API}/students", headers=_auth(admin_token))
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 5, f"expected at least 5 seeded students, got {len(data)}"

    def test_list_students_parent_filtered(self, parent_token):
        r = requests.get(f"{API}/students", headers=_auth(parent_token))
        assert r.status_code == 200
        data = r.json()
        # parent has 2 children linked
        assert len(data) == 2
        names = {s['name'] for s in data}
        assert names == {'Andi Pratama', 'Budi Santoso'}

    def test_create_student_as_coach(self, coach_token):
        payload = {'name': 'TEST Player', 'dob': '2013-05-01', 'position': 'Forward', 'jersey_number': 99}
        r = requests.post(f"{API}/students", headers=_auth(coach_token), json=payload)
        assert r.status_code == 200, r.text
        sid = r.json()['id']
        # verify persistence
        g = requests.get(f"{API}/students/{sid}", headers=_auth(coach_token))
        assert g.status_code == 200
        assert g.json()['name'] == 'TEST Player'

    def test_create_student_as_parent_forbidden(self, parent_token):
        r = requests.post(f"{API}/students", headers=_auth(parent_token),
                          json={'name': 'X', 'dob': '2013-01-01', 'position': 'F'})
        assert r.status_code == 403


# ---------- SESSIONS / ATTENDANCE ----------
class TestSessions:
    def test_list_sessions(self, coach_token):
        r = requests.get(f"{API}/sessions", headers=_auth(coach_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_session_as_coach(self, coach_token):
        r = requests.post(f"{API}/sessions", headers=_auth(coach_token), json={
            'date': '2026-03-20', 'time': '17:00', 'location': 'TEST Field', 'title': 'TEST session'
        })
        assert r.status_code == 200, r.text
        TestSessions.session_id = r.json()['id']

    def test_mark_attendance_upsert(self, coach_token):
        students = requests.get(f"{API}/students", headers=_auth(coach_token)).json()
        sid = TestSessions.session_id
        stud_id = students[0]['id']
        r1 = requests.post(f"{API}/attendance", headers=_auth(coach_token), json={
            'session_id': sid, 'student_id': stud_id, 'status': 'present'
        })
        assert r1.status_code == 200, r1.text
        aid1 = r1.json()['id']
        # upsert same -> same id
        r2 = requests.post(f"{API}/attendance", headers=_auth(coach_token), json={
            'session_id': sid, 'student_id': stud_id, 'status': 'absent'
        })
        assert r2.status_code == 200
        assert r2.json()['id'] == aid1
        assert r2.json()['status'] == 'absent'


# ---------- RATINGS ----------
class TestRatings:
    def test_create_rating(self, coach_token):
        students = requests.get(f"{API}/students", headers=_auth(coach_token)).json()
        sid = students[0]['id']
        r = requests.post(f"{API}/ratings", headers=_auth(coach_token), json={
            'student_id': sid, 'teknik': 8, 'fisik': 7, 'mental': 6, 'taktik': 7, 'kerjasama': 9
        })
        assert r.status_code == 200, r.text
        body = r.json()
        assert body['teknik'] == 8 and body['kerjasama'] == 9

    def test_rating_validation(self, coach_token):
        students = requests.get(f"{API}/students", headers=_auth(coach_token)).json()
        r = requests.post(f"{API}/ratings", headers=_auth(coach_token), json={
            'student_id': students[0]['id'], 'teknik': 15, 'fisik': 5, 'mental': 5, 'taktik': 5, 'kerjasama': 5
        })
        assert r.status_code == 422


# ---------- PAYMENTS ----------
class TestPayments:
    def test_create_payment_as_coach(self, coach_token):
        students = requests.get(f"{API}/students", headers=_auth(coach_token)).json()
        sid = students[0]['id']
        r = requests.post(f"{API}/payments", headers=_auth(coach_token), json={
            'student_id': sid, 'month': 2, 'year': 2026, 'amount': 150000.0, 'status': 'paid'
        })
        assert r.status_code == 200, r.text
        assert r.json()['status'] == 'paid'
        assert r.json()['paid_date'] is not None

    def test_parent_sees_only_own_payments(self, parent_token, coach_token):
        # parent's children
        parent_students = requests.get(f"{API}/students", headers=_auth(parent_token)).json()
        parent_student_ids = {s['id'] for s in parent_students}
        # create payment for parent's child
        if parent_students:
            requests.post(f"{API}/payments", headers=_auth(coach_token), json={
                'student_id': parent_students[0]['id'], 'month': 3, 'year': 2026, 'amount': 100000.0, 'status': 'unpaid'
            })
        r = requests.get(f"{API}/payments", headers=_auth(parent_token))
        assert r.status_code == 200
        for p in r.json():
            assert p['student_id'] in parent_student_ids


# ---------- ANNOUNCEMENTS ----------
class TestAnnouncements:
    def test_create_announcement(self, coach_token):
        r = requests.post(f"{API}/announcements", headers=_auth(coach_token), json={
            'title': 'TEST title', 'content': 'TEST content'
        })
        assert r.status_code == 200, r.text
        assert r.json()['created_by_name']

    def test_list_announcements(self, parent_token):
        r = requests.get(f"{API}/announcements", headers=_auth(parent_token))
        assert r.status_code == 200
        assert len(r.json()) >= 3  # seeded


# ---------- MATCHES ----------
class TestMatches:
    def test_create_and_update_match(self, coach_token):
        r = requests.post(f"{API}/matches", headers=_auth(coach_token), json={
            'opponent': 'TEST FC', 'date': '2026-04-10', 'location': 'TEST Stadium', 'status': 'upcoming'
        })
        assert r.status_code == 200, r.text
        mid = r.json()['id']
        u = requests.put(f"{API}/matches/{mid}", headers=_auth(coach_token), json={
            'opponent': 'TEST FC', 'date': '2026-04-10', 'location': 'TEST Stadium',
            'status': 'finished', 'our_score': 4, 'opponent_score': 1
        })
        assert u.status_code == 200
        assert u.json()['our_score'] == 4
        assert u.json()['status'] == 'finished'


# ---------- STATS ----------
class TestStats:
    def test_stats_shape(self, admin_token):
        r = requests.get(f"{API}/stats", headers=_auth(admin_token))
        assert r.status_code == 200
        d = r.json()
        for k in ('total_students', 'total_sessions', 'upcoming_matches', 'unpaid_payments'):
            assert k in d
            assert isinstance(d[k], int)
        assert d['total_students'] >= 5
