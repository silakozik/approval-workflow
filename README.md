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
- Tailwind CSS v3
- Zustand (auth, theme, i18n)
- Axios

> **Not:** `package.json` içinde `@tanstack/react-query` ve `next-intl` bulunur; projede aktif olarak **Zustand + `src/locales/`** kullanılmaktadır.

## Varsayılan Portlar

| Servis | URL / Port |
|--------|------------|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8001 |
| Swagger UI | http://localhost:8001/docs |
| PostgreSQL (Docker host) | `localhost:5433` |

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
- Zustand: `authStore`, `themeStore`, `langStore`
- Çok dil: `src/locales/tr.ts`, `src/locales/en.ts`
- Axios interceptor ile otomatik JWT token ekleme
- Geliştirme: `next dev --webpack` (Turbopack yerine; OneDrive senkron ortamlarında daha kararlı)

## Kurulum

### Gereksinimler

- Python 3.12+
- Node.js 20+
- PostgreSQL 15+ (veya Docker ile DB)
- Docker (opsiyonel)

### Manuel Kurulum

**1. Veritabanı**

PostgreSQL çalışır durumda olmalı. Docker ile sadece DB açmak için:

```bash
docker-compose up db -d
```

Host üzerinden bağlantı portu: **5433** (container içi 5432).

**2. Backend**

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate   # macOS / Linux
pip install -r requirements.txt
```

`.env` dosyası oluşturun (örnek: `.env.example`):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/approval_workflow
SECRET_KEY=your-long-random-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

```bash
alembic upgrade head
uvicorn app.main:app --reload --port 8001
```

**3. Frontend**

```bash
cd frontend
npm install
npm run dev
```

Tarayıcı: http://localhost:3000

API adresi `frontend/src/lib/api.ts` içinde `http://127.0.0.1:8001/api/v1` olarak tanımlıdır.

### Docker ile Kurulum

```bash
docker-compose up --build
```

İlk çalıştırmada veritabanı tablolarını oluşturun:

```bash
docker exec -it approval_backend alembic upgrade head
```

| Servis | Adres |
|--------|--------|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8001 |
| PostgreSQL | `localhost:5433` |

> Docker frontend imajı production build (`npm start`) kullanır. `NEXT_PUBLIC_API_URL` compose dosyasında tanımlıdır; API URL değişecekse `api.ts` veya ortam değişkeni entegrasyonu güncellenmelidir.

## Frontend Sayfaları

| Rota | Açıklama | Erişim |
|------|----------|--------|
| `/login` | Giriş | Herkes |
| `/register` | Kayıt | Herkes |
| `/workflows` | Workflow listesi | Giriş yapmış kullanıcı |
| `/workflows/new` | Yeni workflow | ADMIN |
| `/workflows/[id]` | Workflow detay | Giriş yapmış kullanıcı |
| `/requests` | Taleplerim | Giriş yapmış kullanıcı |
| `/requests/new` | Yeni talep | Giriş yapmış kullanıcı |
| `/requests/[id]` | Talep detay / onay-red | Giriş yapmış kullanıcı |
| `/requests/[id]/revise` | Reddedilen talebi revize et | Talep sahibi |
| `/approvals` | Bekleyen onaylarım | MANAGER / ADMIN |
| `/admin` | Kullanıcı yönetimi | ADMIN |

## Kullanıcı Rolleri

| Rol | Yetkiler |
|-----|----------|
| ADMIN | Workflow oluşturma/silme, kullanıcı yönetimi, onay |
| MANAGER | Onay verme / reddetme |
| EMPLOYEE | Talep oluşturma |

## API Dokümantasyonu

Backend çalışırken interaktif dokümantasyon: http://localhost:8001/docs

### Authentication

| Method | URL | Açıklama |
|--------|-----|----------|
| POST | /api/v1/auth/register | Kayıt |
| POST | /api/v1/auth/login | Giriş (JWT) |
| GET | /api/v1/auth/users | Kullanıcı listesi (ADMIN) |
| PATCH | /api/v1/auth/users/{id}/role | Rol güncelle (ADMIN) |
| PATCH | /api/v1/auth/users/{id}/toggle-active | Aktif/pasif (ADMIN) |

### Workflows

| Method | URL | Açıklama |
|--------|-----|----------|
| GET | /api/v1/workflows/ | Workflow listesi |
| GET | /api/v1/workflows/{id} | Workflow detay |
| POST | /api/v1/workflows/ | Workflow oluştur (ADMIN) |
| DELETE | /api/v1/workflows/{id} | Soft delete (ADMIN) |
| GET | /api/v1/workflows/users/approvers | Onaycı adayları |

### Requests

| Method | URL | Açıklama |
|--------|-----|----------|
| GET | /api/v1/requests/ | Tüm talepler (filtreli erişim) |
| GET | /api/v1/requests/my | Kendi taleplerim |
| GET | /api/v1/requests/{id} | Talep detay |
| GET | /api/v1/requests/{id}/actions | Onay geçmişi |
| GET | /api/v1/requests/{id}/pending-approvers | Bekleyen onaycılar |
| POST | /api/v1/requests/ | Talep oluştur |
| POST | /api/v1/requests/{id}/approve | Onayla |
| POST | /api/v1/requests/{id}/reject | Reddet |
| POST | /api/v1/requests/{id}/cancel | İptal et |
| PUT | /api/v1/requests/{id}/revise | Revize et |

### Health

| Method | URL | Açıklama |
|--------|-----|----------|
| GET | /health | Sunucu durumu |

## Veritabanı Şeması

**users**
- id, full_name, email, hashed_password
- role (ADMIN / MANAGER / EMPLOYEE)
- approval_limit, is_active, created_at

**workflows**
- id, name, description, process_type, is_active

**workflow_steps**
- id, workflow_id, step_order
- step_type (SERIAL / PARALLEL)
- parallel_rule (ALL / ANY)

**step_approvers**
- id, step_id, user_id, approval_limit

**requests**
- id, title, description, amount
- workflow_id, created_by
- status (PENDING / APPROVED / REJECTED / CANCELLED / REVISED)
- current_step_order

**approval_actions**
- id, request_id, step_id, user_id
- action (APPROVED / REJECTED / CANCELLED / AUTO_APPROVED)
- comment, created_at

## Teknik Kararlar

### Generic Workflow Tasarımı

Workflow şablonları ile talep instance'ları ayrı tutuldu. Bir workflow şablonu birçok talep için kullanılabilir.

### Soft Delete

Workflow'lar fiziksel silinmez; `is_active=False` yapılır. Mevcut talepler etkilenmez.

### Approval Engine

State machine pattern kullanıldı. Her onay aksiyonu sonrası engine sonraki adımı belirler.

### Email Bildirimi

`email_service.py` gerçek SMTP göndermez; onay/red/adım geçişlerinde terminalde **simülasyon log** basar. Production için SMTP entegrasyonu planlanmalıdır.

## Trade-off'lar

- PostgreSQL enum yerine string kullanılabilirdi; migration'lar daha kolay olurdu
- WebSocket yerine polling kullanıldı; production'da WebSocket tercih edilmeli
- Soft delete performansı etkiler; production'da arşiv tablosu düşünülebilir
- Frontend API URL şu an sabit (`api.ts`); production'da ortam değişkeni ile yönetilmeli

## Production'da Yapılacak İyileştirmeler

- Gerçek e-posta bildirimi (SMTP / SendGrid vb.)
- WebSocket ile realtime bildirimler
- Rate limiting
- Redis cache
- Audit log
- Unit ve integration testler
- CI/CD pipeline
- HTTPS / SSL
- Environment bazlı konfigürasyon (`NEXT_PUBLIC_API_URL`, `DATABASE_URL`)

## Bonus Özellikler

- ✅ JWT Authentication
- ✅ Docker (db + backend + frontend)
- ✅ Email notification simulation (log)
- ✅ Role-based authorization (RBAC)
- ✅ Admin panel (kullanıcı rol / aktiflik)
- ✅ Dark Mode 
- ✅ Multi-language TR/EN 
