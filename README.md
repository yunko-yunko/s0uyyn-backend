# s0uyyn-home API

울산작은고래지킴이협회 홈페이지 콘텐츠 API입니다. Node.js 22, Fastify, PostgreSQL로 구성되며 Cloud Run과 Cloud SQL의 Unix socket 연결을 지원합니다.

## 제공 기능

- 홈페이지 기본 문구, 최신 소식, 서비스, 협회원, FAQ 공개 조회
- 관리자 이메일/비밀번호 로그인과 8시간 Bearer 토큰
- 모든 콘텐츠의 생성, 수정, 삭제, 공개 여부 및 노출 순서 관리
- scrypt 비밀번호 해시, 로그인 rate limit, CORS allowlist, 보안 헤더
- 시작 시 advisory lock 기반 PostgreSQL 마이그레이션과 초기 데이터 적용
- Cloud Run liveness/readiness endpoint

## 로컬 실행

Node.js 22와 PostgreSQL이 필요합니다. 프로젝트용 Docker PostgreSQL은 PC에 설치된 PostgreSQL과 충돌하지 않도록 호스트 `5433` 포트를 사용합니다.

```powershell
Copy-Item .env.example .env
docker compose up -d
npm install
npm run dev
```

첫 시작에 `ADMIN_EMAIL`, `ADMIN_PASSWORD`로 최초 관리자 한 명이 생성됩니다. 관리자가 이미 한 명이라도 있으면 이 값으로 계정을 추가하거나 비밀번호를 덮어쓰지 않습니다. 운영 비밀번호는 12자 이상으로 설정하세요.

기본 주소는 `http://localhost:8080`입니다.

- `GET /healthz`: 프로세스 상태
- `GET /readyz`: 데이터베이스 연결 상태
- `GET /api/v1/content`: 홈페이지 전체 공개 콘텐츠
- `GET /api/v1/content/site`
- `GET /api/v1/content/recent-cards`
- `GET /api/v1/content/services`
- `GET /api/v1/content/members`
- `GET /api/v1/content/faqs`
- `POST /api/v1/auth/login`
- `GET /api/v1/admin/me`
- `GET /api/v1/admin/content`
- `PUT /api/v1/admin/site`
- `POST|PUT|DELETE /api/v1/admin/{recent-cards|services|members|faqs}`

관리 API는 `Authorization: Bearer <accessToken>`이 필요합니다. 기존 홈페이지 계약을 유지하기 위해 서비스 개발자 배열의 API 필드명은 `devleoper`입니다.

## GCP 배포

배포 설정은 [cloudbuild.yaml](./cloudbuild.yaml)에 있습니다. 기본 리전은 서울 `asia-northeast3`입니다.

1. Cloud SQL for PostgreSQL 인스턴스와 `s0uyyn_home` 데이터베이스, 애플리케이션 사용자를 만듭니다. 애플리케이션 사용자가 해당 DB의 owner이거나 테이블을 생성할 권한이 있어야 합니다.
2. Artifact Registry Docker 저장소를 만들고 Cloud Build, Cloud Run, Artifact Registry, Cloud SQL Admin, Secret Manager API를 활성화합니다.
3. Secret Manager에 `s0uyyn-db-password`, `s0uyyn-jwt-secret`, `s0uyyn-admin-password`를 만들고 버전 1을 추가합니다. JWT secret은 32자 이상의 무작위 문자열을 사용합니다.
4. Cloud Run 실행 서비스 계정에 `roles/cloudsql.client`와 `roles/secretmanager.secretAccessor`를 부여합니다. Cloud Build 서비스 계정에는 Cloud Run 배포와 Artifact Registry push 권한을 부여합니다.
5. `cloudbuild.yaml`의 substitution 기본값, 특히 Cloud SQL connection name과 허용할 실제 홈페이지·대시보드 origin을 프로젝트에 맞게 바꿉니다.

```powershell
gcloud builds submit --region=asia-northeast3 `
  --config=cloudbuild.yaml `
  --substitutions=_CLOUD_SQL_INSTANCE="PROJECT_ID:asia-northeast3:INSTANCE_ID",_ADMIN_EMAIL="admin@example.com"
```

Cloud Run은 `/cloudsql/PROJECT:REGION:INSTANCE` socket을 `PGHOST`로 사용합니다. 연결은 Cloud SQL Auth Proxy를 통해 자동 암호화되므로 이 경로에서는 `DATABASE_SSL=false`가 정상입니다.

운영 중 secret을 교체하면 `cloudbuild.yaml`의 각 `*_SECRET_VERSION`도 새 버전 번호로 올린 뒤 새 revision을 배포하세요.

## 검증

```powershell
npm test
```

테스트는 입력 검증, 비밀번호/JWT, 공개 콘텐츠와 관리자 인증 라우트를 확인합니다.
