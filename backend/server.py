from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import bcrypt
import jwt
from pathlib import Path
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

SECRET_KEY = os.environ.get('JWT_SECRET', 'ssb-academy-secret-key-change-in-production-2026')
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_DAYS = 30

app = FastAPI(title="SSB Academy API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


# ============ MODELS ============
Role = Literal['admin', 'coach', 'parent']

class UserSignup(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None
    role: Role = 'parent'

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    email: str
    name: str
    phone: Optional[str] = None
    role: str

class AuthResponse(BaseModel):
    token: str
    user: UserOut

class StudentIn(BaseModel):
    name: str
    dob: str  # YYYY-MM-DD
    position: str
    jersey_number: Optional[int] = None
    parent_email: Optional[str] = None
    photo: Optional[str] = None  # base64
    notes: Optional[str] = None

class StudentOut(StudentIn):
    id: str
    parent_id: Optional[str] = None
    joined_at: str

class TrainingSessionIn(BaseModel):
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    location: str
    title: str
    notes: Optional[str] = None

class TrainingSessionOut(TrainingSessionIn):
    id: str
    created_by: str

class AttendanceIn(BaseModel):
    session_id: str
    student_id: str
    status: Literal['present', 'absent', 'sick']

class AttendanceOut(AttendanceIn):
    id: str
    marked_by: str
    marked_at: str

class PaymentIn(BaseModel):
    student_id: str
    month: int  # 1-12
    year: int
    amount: float
    status: Literal['paid', 'unpaid'] = 'unpaid'

class PaymentOut(PaymentIn):
    id: str
    paid_date: Optional[str] = None

class SkillRatingIn(BaseModel):
    student_id: str
    teknik: int = Field(ge=1, le=10)
    fisik: int = Field(ge=1, le=10)
    mental: int = Field(ge=1, le=10)
    taktik: int = Field(ge=1, le=10)
    kerjasama: int = Field(ge=1, le=10)
    notes: Optional[str] = None

class SkillRatingOut(SkillRatingIn):
    id: str
    rated_by: str
    rated_at: str

class AnnouncementIn(BaseModel):
    title: str
    content: str
    image: Optional[str] = None  # base64 or url

class AnnouncementOut(AnnouncementIn):
    id: str
    created_by: str
    created_by_name: str
    created_at: str

class MatchIn(BaseModel):
    opponent: str
    date: str
    location: str
    our_score: Optional[int] = None
    opponent_score: Optional[int] = None
    status: Literal['upcoming', 'finished'] = 'upcoming'

class MatchOut(MatchIn):
    id: str


# ============ AUTH HELPERS ============
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12)).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        'sub': user_id,
        'email': email,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS),
        'iat': datetime.now(timezone.utc),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get('sub')
        if not user_id:
            raise HTTPException(401, 'Invalid token')
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, 'Token expired')
    except jwt.InvalidTokenError:
        raise HTTPException(401, 'Invalid token')
    user = await db.users.find_one({'id': user_id}, {'_id': 0, 'password': 0})
    if not user:
        raise HTTPException(401, 'User not found')
    return user

def require_role(*roles: str):
    async def checker(user: dict = Depends(get_current_user)) -> dict:
        if user['role'] not in roles:
            raise HTTPException(403, f"Requires role: {', '.join(roles)}")
        return user
    return checker


# ============ AUTH ROUTES ============
@api_router.post('/auth/signup', response_model=AuthResponse)
async def signup(data: UserSignup):
    existing = await db.users.find_one({'email': data.email})
    if existing:
        raise HTTPException(400, 'Email already registered')
    user_id = str(uuid.uuid4())
    doc = {
        'id': user_id,
        'email': data.email,
        'password': hash_password(data.password),
        'name': data.name,
        'phone': data.phone,
        'role': data.role,
        'created_at': datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    token = create_token(user_id, data.email, data.role)
    return AuthResponse(
        token=token,
        user=UserOut(id=user_id, email=data.email, name=data.name, phone=data.phone, role=data.role)
    )

@api_router.post('/auth/login', response_model=AuthResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({'email': data.email})
    if not user or not verify_password(data.password, user['password']):
        raise HTTPException(401, 'Invalid credentials')
    token = create_token(user['id'], user['email'], user['role'])
    return AuthResponse(
        token=token,
        user=UserOut(id=user['id'], email=user['email'], name=user['name'], phone=user.get('phone'), role=user['role'])
    )

@api_router.get('/auth/me', response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return UserOut(id=user['id'], email=user['email'], name=user['name'], phone=user.get('phone'), role=user['role'])


# ============ STUDENTS ============
@api_router.get('/students', response_model=List[StudentOut])
async def list_students(user: dict = Depends(get_current_user)):
    query = {}
    if user['role'] == 'parent':
        query = {'parent_id': user['id']}
    students = await db.students.find(query, {'_id': 0}).to_list(500)
    return students

@api_router.post('/students', response_model=StudentOut)
async def create_student(data: StudentIn, user: dict = Depends(require_role('admin', 'coach'))):
    sid = str(uuid.uuid4())
    parent_id = None
    if data.parent_email:
        parent = await db.users.find_one({'email': data.parent_email, 'role': 'parent'})
        if parent:
            parent_id = parent['id']
    doc = {
        'id': sid,
        **data.dict(),
        'parent_id': parent_id,
        'joined_at': datetime.now(timezone.utc).isoformat(),
    }
    await db.students.insert_one(doc)
    doc.pop('_id', None)
    return doc

@api_router.get('/students/{sid}', response_model=StudentOut)
async def get_student(sid: str, user: dict = Depends(get_current_user)):
    s = await db.students.find_one({'id': sid}, {'_id': 0})
    if not s:
        raise HTTPException(404, 'Not found')
    if user['role'] == 'parent' and s.get('parent_id') != user['id']:
        raise HTTPException(403, 'Forbidden')
    return s

@api_router.delete('/students/{sid}')
async def delete_student(sid: str, user: dict = Depends(require_role('admin'))):
    await db.students.delete_one({'id': sid})
    return {'ok': True}


# ============ TRAINING SESSIONS ============
@api_router.get('/sessions', response_model=List[TrainingSessionOut])
async def list_sessions(user: dict = Depends(get_current_user)):
    sessions = await db.sessions.find({}, {'_id': 0}).sort('date', -1).to_list(200)
    return sessions

@api_router.post('/sessions', response_model=TrainingSessionOut)
async def create_session(data: TrainingSessionIn, user: dict = Depends(require_role('admin', 'coach'))):
    sid = str(uuid.uuid4())
    doc = {'id': sid, **data.dict(), 'created_by': user['id']}
    await db.sessions.insert_one(doc)
    doc.pop('_id', None)
    return doc

@api_router.delete('/sessions/{sid}')
async def delete_session(sid: str, user: dict = Depends(require_role('admin', 'coach'))):
    await db.sessions.delete_one({'id': sid})
    await db.attendance.delete_many({'session_id': sid})
    return {'ok': True}


# ============ ATTENDANCE ============
@api_router.get('/attendance/session/{session_id}', response_model=List[AttendanceOut])
async def session_attendance(session_id: str, user: dict = Depends(get_current_user)):
    items = await db.attendance.find({'session_id': session_id}, {'_id': 0}).to_list(500)
    return items

@api_router.get('/attendance/student/{student_id}', response_model=List[AttendanceOut])
async def student_attendance(student_id: str, user: dict = Depends(get_current_user)):
    items = await db.attendance.find({'student_id': student_id}, {'_id': 0}).to_list(500)
    return items

@api_router.post('/attendance', response_model=AttendanceOut)
async def mark_attendance(data: AttendanceIn, user: dict = Depends(require_role('admin', 'coach'))):
    # upsert by (session, student)
    existing = await db.attendance.find_one({'session_id': data.session_id, 'student_id': data.student_id})
    now = datetime.now(timezone.utc).isoformat()
    if existing:
        await db.attendance.update_one(
            {'id': existing['id']},
            {'$set': {'status': data.status, 'marked_by': user['id'], 'marked_at': now}}
        )
        return {**data.dict(), 'id': existing['id'], 'marked_by': user['id'], 'marked_at': now}
    aid = str(uuid.uuid4())
    doc = {'id': aid, **data.dict(), 'marked_by': user['id'], 'marked_at': now}
    await db.attendance.insert_one(doc)
    doc.pop('_id', None)
    return doc


# ============ PAYMENTS ============
@api_router.get('/payments', response_model=List[PaymentOut])
async def list_payments(user: dict = Depends(get_current_user)):
    if user['role'] == 'parent':
        students = await db.students.find({'parent_id': user['id']}, {'_id': 0, 'id': 1}).to_list(100)
        ids = [s['id'] for s in students]
        items = await db.payments.find({'student_id': {'$in': ids}}, {'_id': 0}).to_list(500)
    else:
        items = await db.payments.find({}, {'_id': 0}).to_list(1000)
    return items

@api_router.get('/payments/student/{student_id}', response_model=List[PaymentOut])
async def student_payments(student_id: str, user: dict = Depends(get_current_user)):
    items = await db.payments.find({'student_id': student_id}, {'_id': 0}).sort('year', -1).to_list(100)
    return items

@api_router.post('/payments', response_model=PaymentOut)
async def create_payment(data: PaymentIn, user: dict = Depends(require_role('admin', 'coach'))):
    existing = await db.payments.find_one({'student_id': data.student_id, 'month': data.month, 'year': data.year})
    paid_date = datetime.now(timezone.utc).isoformat() if data.status == 'paid' else None
    if existing:
        await db.payments.update_one(
            {'id': existing['id']},
            {'$set': {'status': data.status, 'amount': data.amount, 'paid_date': paid_date}}
        )
        return {**data.dict(), 'id': existing['id'], 'paid_date': paid_date}
    pid = str(uuid.uuid4())
    doc = {'id': pid, **data.dict(), 'paid_date': paid_date}
    await db.payments.insert_one(doc)
    doc.pop('_id', None)
    return doc


# ============ SKILL RATINGS ============
@api_router.get('/ratings/student/{student_id}', response_model=List[SkillRatingOut])
async def student_ratings(student_id: str, user: dict = Depends(get_current_user)):
    items = await db.ratings.find({'student_id': student_id}, {'_id': 0}).sort('rated_at', -1).to_list(50)
    return items

@api_router.post('/ratings', response_model=SkillRatingOut)
async def create_rating(data: SkillRatingIn, user: dict = Depends(require_role('admin', 'coach'))):
    rid = str(uuid.uuid4())
    doc = {
        'id': rid,
        **data.dict(),
        'rated_by': user['id'],
        'rated_at': datetime.now(timezone.utc).isoformat(),
    }
    await db.ratings.insert_one(doc)
    doc.pop('_id', None)
    return doc


# ============ ANNOUNCEMENTS ============
@api_router.get('/announcements', response_model=List[AnnouncementOut])
async def list_announcements(user: dict = Depends(get_current_user)):
    items = await db.announcements.find({}, {'_id': 0}).sort('created_at', -1).to_list(100)
    return items

@api_router.post('/announcements', response_model=AnnouncementOut)
async def create_announcement(data: AnnouncementIn, user: dict = Depends(require_role('admin', 'coach'))):
    aid = str(uuid.uuid4())
    doc = {
        'id': aid,
        **data.dict(),
        'created_by': user['id'],
        'created_by_name': user['name'],
        'created_at': datetime.now(timezone.utc).isoformat(),
    }
    await db.announcements.insert_one(doc)
    doc.pop('_id', None)
    return doc

@api_router.delete('/announcements/{aid}')
async def delete_announcement(aid: str, user: dict = Depends(require_role('admin', 'coach'))):
    await db.announcements.delete_one({'id': aid})
    return {'ok': True}


# ============ MATCHES ============
@api_router.get('/matches', response_model=List[MatchOut])
async def list_matches(user: dict = Depends(get_current_user)):
    items = await db.matches.find({}, {'_id': 0}).sort('date', -1).to_list(100)
    return items

@api_router.post('/matches', response_model=MatchOut)
async def create_match(data: MatchIn, user: dict = Depends(require_role('admin', 'coach'))):
    mid = str(uuid.uuid4())
    doc = {'id': mid, **data.dict()}
    await db.matches.insert_one(doc)
    doc.pop('_id', None)
    return doc

@api_router.put('/matches/{mid}', response_model=MatchOut)
async def update_match(mid: str, data: MatchIn, user: dict = Depends(require_role('admin', 'coach'))):
    await db.matches.update_one({'id': mid}, {'$set': data.dict()})
    doc = await db.matches.find_one({'id': mid}, {'_id': 0})
    return doc

@api_router.delete('/matches/{mid}')
async def delete_match(mid: str, user: dict = Depends(require_role('admin', 'coach'))):
    await db.matches.delete_one({'id': mid})
    return {'ok': True}


# ============ DASHBOARD STATS ============
@api_router.get('/stats')
async def stats(user: dict = Depends(get_current_user)):
    students = await db.students.count_documents({})
    sessions = await db.sessions.count_documents({})
    upcoming_matches = await db.matches.count_documents({'status': 'upcoming'})
    unpaid = await db.payments.count_documents({'status': 'unpaid'})
    return {
        'total_students': students,
        'total_sessions': sessions,
        'upcoming_matches': upcoming_matches,
        'unpaid_payments': unpaid,
    }


# ============ SEED ============
async def seed_data():
    """Idempotent seeding of demo accounts and data."""
    demo_users = [
        {'email': 'admin@ssb.id', 'password': 'admin123', 'name': 'Admin SSB', 'role': 'admin', 'phone': '081234567890'},
        {'email': 'coach@ssb.id', 'password': 'coach123', 'name': 'Coach Budi', 'role': 'coach', 'phone': '081234567891'},
        {'email': 'parent@ssb.id', 'password': 'parent123', 'name': 'Pak Joko', 'role': 'parent', 'phone': '081234567892'},
    ]
    for u in demo_users:
        existing = await db.users.find_one({'email': u['email']})
        if not existing:
            await db.users.insert_one({
                'id': str(uuid.uuid4()),
                'email': u['email'],
                'password': hash_password(u['password']),
                'name': u['name'],
                'phone': u['phone'],
                'role': u['role'],
                'created_at': datetime.now(timezone.utc).isoformat(),
            })
            logger.info(f"Seeded {u['email']}")

    # Seed sample students linked to parent
    parent = await db.users.find_one({'role': 'parent'})
    if parent:
        student_count = await db.students.count_documents({})
        if student_count == 0:
            sample_students = [
                {'name': 'Andi Pratama', 'dob': '2012-03-15', 'position': 'Forward', 'jersey_number': 9, 'parent_id': parent['id']},
                {'name': 'Budi Santoso', 'dob': '2011-07-22', 'position': 'Midfielder', 'jersey_number': 10, 'parent_id': parent['id']},
                {'name': 'Citra Adi', 'dob': '2013-01-10', 'position': 'Defender', 'jersey_number': 4, 'parent_id': None},
                {'name': 'Dani Wijaya', 'dob': '2012-09-05', 'position': 'Goalkeeper', 'jersey_number': 1, 'parent_id': None},
                {'name': 'Eko Putra', 'dob': '2011-11-30', 'position': 'Forward', 'jersey_number': 7, 'parent_id': None},
            ]
            for s in sample_students:
                await db.students.insert_one({
                    'id': str(uuid.uuid4()),
                    **s,
                    'photo': None,
                    'notes': None,
                    'parent_email': None,
                    'joined_at': datetime.now(timezone.utc).isoformat(),
                })
            logger.info("Seeded sample students")

    # Seed announcements
    if await db.announcements.count_documents({}) == 0:
        admin = await db.users.find_one({'role': 'admin'})
        if admin:
            samples = [
                {'title': 'Latihan Perdana Minggu Depan', 'content': 'Latihan perdana akan dimulai Senin pukul 16:00 di lapangan utama. Wajib hadir bagi semua siswa.'},
                {'title': 'Turnamen U-12 Bulan Maret', 'content': 'SSB Academy akan mengikuti turnamen U-12 tingkat kota. Pelatih akan mengumumkan skuad pekan depan.'},
                {'title': 'Pembayaran SPP Februari', 'content': 'Mohon orang tua segera melunasi SPP bulan Februari 2026 sebelum tanggal 28.'},
            ]
            for s in samples:
                await db.announcements.insert_one({
                    'id': str(uuid.uuid4()),
                    **s,
                    'image': None,
                    'created_by': admin['id'],
                    'created_by_name': admin['name'],
                    'created_at': datetime.now(timezone.utc).isoformat(),
                })
            logger.info("Seeded announcements")

    # Seed matches
    if await db.matches.count_documents({}) == 0:
        samples = [
            {'opponent': 'SSB Garuda Muda', 'date': '2026-03-15', 'location': 'Stadion Mini Utara', 'status': 'upcoming', 'our_score': None, 'opponent_score': None},
            {'opponent': 'SSB Bintang Timur', 'date': '2026-02-01', 'location': 'Lapangan Persib', 'status': 'finished', 'our_score': 3, 'opponent_score': 2},
        ]
        for s in samples:
            await db.matches.insert_one({'id': str(uuid.uuid4()), **s})
        logger.info("Seeded matches")

    # Seed a sample training session
    if await db.sessions.count_documents({}) == 0:
        admin = await db.users.find_one({'role': 'admin'})
        if admin:
            await db.sessions.insert_one({
                'id': str(uuid.uuid4()),
                'date': '2026-02-10',
                'time': '16:00',
                'location': 'Lapangan Utama',
                'title': 'Latihan Teknik Dasar',
                'notes': 'Fokus passing dan dribbling',
                'created_by': admin['id'],
            })

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await seed_data()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
