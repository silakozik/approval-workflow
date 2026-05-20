# Approval Workflow Management System

Kurumsal şirketlerde satınalma, tedarikçi, sözleşme ve sipariş gibi süreçler için generic bir onay akış yönetim sistemi.

## Teknoloji Stack

**Backend**
- Python 3.12
- FastAPI
- PostgreSQL
- SQLAlchemy (ORM)
- Alembic (Migration)
- JWT Authentication

**Frontend**
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Zustand (State Management)
- Axios

## Mimari Yaklaşım

### Backend Katmanlı Mimari

API Layer (endpoints/) → Service Layer (services/) → Repository Layer (repositories/) → Database

- **API Layer**: HTTP isteklerini karşılar, validation yapar, response döner
- **Service Layer**: Business logic burada. Approval Engine bu katmanda.
- **Repository Layer**: Sadece veritabanı sorguları. İş mantığı içermez.
- **Models**: SQLAlchemy ORM modelleri
- **Schemas**: Pydantic validation şemaları

### Approval Engine
Projenin kalbi `approval_engine.py` dosyasında. Şu özellikleri destekler:

- **Serial Approval**: Adımlar sırayla ilerler
- **Parallel Approval (ALL)**: Tüm onaycılar onaylamalı
- **Parallel Approval (ANY)**: Biri onaylarsa yeter
- **Limit Bazlı Otomatik Geçiş**: Tutar < limit ise adım otomatik geçilir

### Frontend Mimari
- Next.js App Router ile sayfa bazlı routing
- Zustand ile global auth state yönetimi
- Axios interceptor ile otomatik JWT token ekleme

## Kurulum

### Gereksinimler
- Python 3.12+
- Node.js 20+
- PostgreSQL 15+
- Docker (opsiyonel)

### Manuel Kurulum

**Backend**
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8001
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

### Docker ile Kurulum
```bash
docker-compose up --build
```

## Kullanıcı Rolleri

| Rol | Yetkiler |
|-----|----------|
| ADMIN | Workflow oluşturma/silme, kullanıcı yönetimi |
| MANAGER | Onay verme/reddetme |
| EMPLOYEE | Talep oluşturma |

## API Dokümantasyonu

Backend çalışırken: `http://localhost:8001/docs`

| Method | URL | Açıklama |
|--------|-----|----------|
| POST | /api/v1/auth/register | Kayıt |
| POST | /api/v1/auth/login | Giriş |
| GET | /api/v1/workflows/ | Workflow listesi |
| POST | /api/v1/workflows/ | Workflow oluştur (ADMIN) |
| POST | /api/v1/requests/ | Talep oluştur |
| POST | /api/v1/requests/{id}/approve | Onayla |
| POST | /api/v1/requests/{id}/reject | Reddet |
| POST | /api/v1/requests/{id}/cancel | İptal et |
| PUT | /api/v1/requests/{id}/revise | Revize et |

## Veritabanı Şeması

users
- id, full_name, email, hashed_password
- role (ADMIN/MANAGER/EMPLOYEE)
- approval_limit, is_active, created_at

workflows
- id, name, description, process_type, is_active

workflow_steps
- id, workflow_id, step_order
- step_type (SERIAL/PARALLEL)
- parallel_rule (ALL/ANY)

step_approvers
- id, step_id, user_id, approval_limit

requests
- id, title, description, amount
- workflow_id, created_by
- status (PENDING/APPROVED/REJECTED/CANCELLED/REVISED)
- current_step_order

approval_actions
- id, request_id, step_id, user_id
- action (APPROVED/REJECTED/CANCELLED/AUTO_APPROVED)
- comment, created_at

## Teknik Kararlar

### Generic Workflow Tasarımı
Workflow şablonları ile talep instance'ları ayrı tutuldu. Bir workflow şablonu birçok talep için kullanılabilir.

### Soft Delete
Workflow'lar silinmez, `is_active=False` yapılır. Böylece mevcut talepler etkilenmez.

### Approval Engine
State machine pattern kullanıldı. Her onay aksiyonu sonrası engine sonraki adımı belirler.

## Trade-off'lar

- PostgreSQL enum yerine string kullanılabilirdi, migration'lar daha kolay olurdu
- WebSocket yerine polling kullanıldı, production'da WebSocket tercih edilmeli
- Soft delete performansı etkiler, production'da arşiv tablosu düşünülebilir

## Production'da Yapılacak İyileştirmeler

- WebSocket ile realtime bildirimler
- Rate limiting
- Redis cache
- Audit log
- Unit ve integration testler
- CI/CD pipeline
- HTTPS / SSL
- Environment bazlı konfigürasyon

## Bonus Özellikler

- ✅ JWT Authentication
- ✅ Docker
- ✅ Email notification simulation
- ✅ Role-based authorization (RBAC)
- ✅ Dark Moded
- ✅ Multi-language support (TR/EN)