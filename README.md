# BYTE BACK 방어전 시작 틀 R5

이 저장소는 1단계에서 학생 본인이 GitHub 저장소와 Vercel 배포를 만드는 출발점입니다. 포함된 메모 네 건은 가상 자료입니다. 실제 학생 자료, 토큰, 비밀키를 넣지 마세요.

## 1단계 당시 절차 (현재는 아래 2단계 기록 적용)

1. GitHub 계정을 만듭니다.
2. 방어전 1단계 카드의 **Deploy** 버튼을 누릅니다. Vercel에 GitHub로 로그인하고, 새 저장소가 **본인 계정의 Public 저장소**인지 확인한 뒤 Deploy를 누릅니다.
3. 배포가 끝나면 화면에 나온 `https://…vercel.app` 주소를 방어전 1단계 카드에 붙여넣고 제출합니다. 저장소 주소나 설정 파일은 적지 않습니다.

배포가 끝나면 `/`에서 점령된 가상 자료실을 볼 수 있습니다. `/data.json`에는 같은 가상 메모가 공개됩니다. 이 공개 상태를 확인하는 것이 1단계의 출발점입니다. 1단계 접수와 심판 판정은 포털에서 확인합니다.

## 1단계 시작 틀의 자동 처리 (과거 상태)

`vercel.json`은 정적 결과물 `public`을 배포합니다. 빌드 명령 `npm run build`는 Vercel이 제공하는 GitHub 저장소 소유자·이름, 커밋 SHA, 배포 URL을 검증하고 `public/aleph.json`을 생성합니다. 이 값이 없으면 빌드가 실패하므로, 성공한 것처럼 빈 주소를 내보내지 않습니다. `aleph.json`의 내용만으로 저장소 소유권이나 방어 성공을 인정하지 않습니다. 심판이 공개 저장소의 실제 커밋과 배포된 자료를 따로 대조해야 합니다.

`aleph.config.json`의 `repoUrl`과 `publicAppUrl`은 이전 제출 묶음 방식의 자리표시자입니다. 1단계에서는 학생이 편집하지 않습니다. 2단계 이후 코딩 도구가 필요한 설정과 보호 기능을 단계별로 작성합니다. `npm run bundle`과 `bundle-notes.json`도 1단계의 세 걸음에는 포함되지 않습니다.

로컬에서 가상 화면만 확인할 때는 `npm run build -- --local`을 사용합니다. 로컬 실행은 Vercel 배포나 심판 접수를 증명하지 않습니다. 저장소의 `src/attack-check.mjs`는 실제 배포가 된 뒤 `/data.json`을 비로그인으로 요청해 공개 가상 메모의 확인 표시를 읽습니다.

## 다음 단계의 코딩 도구에 전달할 규칙

[AGENTS.md](AGENTS.md)를 먼저 읽히고 한 번에 한 제작 단위만 요청하세요. 2단계부터는 자료 보호를 구현할 때 `public/data.json`을 복사하는 1단계 빌드 흐름도 함께 바꿔야 합니다. 3단계 이후의 로그인, 허용 경로, 5단계의 원본 API 주소, 6단계 이후 정책 규칙은 해당 단계 원고와 계약에 맞춰 추가합니다. 비밀번호·토큰·서버 전용 키·실제 학생 기록을 코드, Git, 제출 묶음에 넣지 않습니다.

`src/decider.mjs`와 `src/detect.mjs`의 로컬 시험은 반 엔진이나 운영 심판의 결과가 아닙니다. 1단계 이후 제출 묶음 계약 `aleph.defense.submission.v2`는 `scripts/bundle.mjs`에 남아 있으며, 코딩 도구가 해당 단계의 최신 배포 주소와 Git 원격을 맞춘 뒤 사용합니다.

## 2단계 저장점 · 자료를 코드 밖으로 옮깁니다

현재 구현: 공개 JSON은 메모 0건이며 화면은 Vercel 서버 함수 `/api/notes`를 읽습니다. 기존 정책·탐지·AI 도구는 보존했습니다. 단계는 2이며 로그인 발급자·허용 경로·원본 API 보호는 아직 구현하지 않았습니다. 마지막 시작 틀 커밋과 기존 README는 모두 1단계였으며 단계 불일치는 없었습니다. 원본 자료는 요청의 세 건과 달리 네 건이었습니다.

### 적용 및 다시 실행

1. Supabase SQL Editor에서 `sql/step2.sql`을 실행합니다. 마지막 조회에서 `owner_id`가 uuid, `relrowsecurity`가 true, anon·authenticated의 `can_read`가 모두 false인지 확인합니다. auth.users 외래키는 없습니다. 서버 역할만 읽습니다.
2. Vercel 프로젝트 Settings → Environment Variables에 `SUPABASE_URL`, 서버 전용 `SUPABASE_SECRET_KEY`를 직접 등록하고 재배포합니다. 값을 Git·브라우저·로그·제출 묶음에 넣지 않습니다.
3. 로컬 정적 빌드: `npm run build -- --local`. 실제 배포 주소를 `aleph.config.json`의 `publicAppUrl`에 기록하고 커밋한 뒤 `npm run bundle`을 실행합니다. 현재 주소는 미확인이므로 null이며 운영 자기 점검은 미실행입니다.
4. 배포 화면 `/`에서 카드 네 개를 확인하고 `/data.json`에서 `notes: []`를 확인합니다. `/aleph.json`의 저장소·커밋·배포 주소도 확인합니다. 비로그인 DB 직접 읽기는 거부되어야 합니다. 공개 키 요청의 심판 판정은 이 자기 점검과 별개입니다.

### 최신 파일의 문장 검색

기존 1단계 data.json의 네 content 값을 임시 파일에 한 줄씩 저장한 뒤 `rg -n -F -f /tmp/vault-note-patterns.txt public api scripts src sql README.md data.json`으로 검색합니다. 임시 파일과 문장 본문을 Git 또는 제출 묶음에 넣지 않습니다. GitHub 최신 커밋을 별도 폴더에 clone하여 같은 검색을 반복합니다. 배포된 `/`, `/data.json`, `/aleph.json`과 화면에서 참조하는 정적 JS를 다운로드하여 같은 검색을 반복합니다. `/api/notes`는 동적 자료 응답이므로 정적 파일 검색과 구분하여 비로그인 요청 결과를 기록합니다.

로컬 최신 파일 검사: 메모 본문 문장 0건. SQL은 네 건을 재현하기 위해 UTF-8 hex로 인코딩했습니다. 이는 암호화가 아니며 누구나 복원할 수 있는 가상 fixture입니다. 이 방식으로 실제 비밀이나 개인정보를 저장해서는 안 됩니다. GitHub 최신 파일과 현재 배포 파일 검사는 아직 미실행입니다.

### 남은 약점 및 검증 상태

- `/api/notes`는 공개 주소이며 로그인·소유자 검사 없이 서버 권한으로 자료를 반환합니다. RLS와 DB 권한 회수만으로 이 API의 익명 열람을 막지 못합니다. 3단계 전까지 가상 메모만 사용합니다.
- SQL Editor 실행, 실제 환경변수 등록, 운영 배포, 화면 네 카드, 운영 정적 문장 검색, 심판 공개 키 요청: 미실행.
- 옛 공개 커밋과 옛 배포는 지우지 않았습니다. 기존 문장과 인코딩 fixture를 복원할 수 있으므로 과거 노출이 해소됐다고 주장하지 않습니다.

## 3단계 저장점 · 진짜 로그인을 붙입니다

2단계 배포 식별 오류를 수정한 커밋 ebd35d1에서 이어받았습니다. 앞의 2단계 미실행 기록은 당시 상태이며, 해당 커밋의 Vercel 성공 상태는 확인했습니다. 운영 주소는 https://choi-bujang-secret-vault-khaki.vercel.app 입니다.

공식 Supabase SDK로 이메일·비밀번호 로그인, 로그아웃, 세션 갱신을 처리합니다. 실패 이유는 화면에 표시합니다. 브라우저에는 publishable key만 있으며 서버 키를 포함하지 않습니다. 서버는 기존 src/verify-login.mjs를 그대로 호출하고 확인된 사용자 ID만 사용합니다. 무로그인/잘못된 인증 형식은 설정 상태와 관계없이 401 JSON으로 거부합니다. 인증된 목록은 owner_id로 필터링하며 추가 시 확인된 사용자 ID를 저장합니다.

경로: GET/POST /api/notes, GET/PUT/DELETE /api/notes/:id. 메모 형식은 {id,title,body}, 목록은 배열입니다. POST에서 ID 생략 시 UUID를 생성해 {id}를 반환합니다. 삭제 후 GET은 404입니다. 발급자·JWKS·audience와 경로는 aleph.config.json에 기록했습니다. judgeIssuer는 보존했습니다.

### 실제 적용 순서

1. Supabase SQL Editor에서 sql/step2.sql을 먼저 실행하고 이어 sql/step3.sql을 실행합니다. 기존 자료는 보존되며 ID는 UUID로 바뀝니다. 이미 3단계 SQL을 적용했다면 step2.sql을 다시 실행하지 않습니다.
2. Authentication → Users에서 학습용 A·B 계정을 직접 생성합니다. 비밀번호는 여기나 Git에 남기지 않습니다. 기존 네 메모는 owner_id가 null이므로 로그인 계정의 목록에 나타나지 않습니다. 필요하면 Table Editor에서 A의 사용자 UUID를 owner_id에 직접 지정합니다.
3. Vercel Settings → Environment Variables에 SUPABASE_URL과 서버 전용 SUPABASE_SECRET_KEY를 직접 등록합니다. 이미 등록했다면 유지합니다. 환경변수를 바꾼 경우 최신 커밋으로 재배포합니다. 코드 변경은 GitHub 연결로 자동 배포됩니다.
4. 사이트의 로그인 버튼 → 새 메모 저장 → 수정 → 삭제 → 로그아웃을 확인합니다. 시크릿 창의 /api/notes는 401 JSON이어야 합니다. /data.json은 메모 0건, /aleph.json은 3단계, 첫 응답은 nosniff여야 합니다.

로컬 재실행: npm run build -- --local. 저장점 커밋 후 npm run bundle. 묶음은 무로그인 운영 요청의 실제 결과만 기록하며 A CRUD는 직접 실행 전까지 미실행입니다. SQL 실행·A/B 로그인·CRUD 실제 시험은 아직 미실행입니다.

### 4단계에서 막을 남은 약점

로그인한 B는 A의 메모 UUID를 알면 개별 GET·PUT·DELETE가 가능합니다. 개별 경로의 소유자 검사는 의도적으로 아직 구현하지 않았습니다. B의 목록에는 A 메모가 표시되지 않습니다. 서버 키는 RLS를 우회하므로 이 소유자 검사를 서버에 추가해야 합니다. 가상 메모만 사용합니다. 옛 커밋·배포의 노출도 그대로 남아 있습니다.

## 4단계 저장점 · 로그인해도 내 자료만 보이게 합니다

마지막 3단계 저장점 299022e와 README의 단계는 일치했고 다른 변경은 없었습니다. 3단계 Vercel 성공과 운영 무로그인 401 JSON, 빈 data.json, 3단계 aleph.json, nosniff는 이전 작업에서 확인했습니다. 앞의 미실행 기록은 당시 기록입니다.

현재 API: 목록·개별 GET·PUT·DELETE 모두 검증된 사용자 ID로 owner_id를 필터링합니다. POST의 owner_id는 검증된 ID로 서버가 작성합니다. PUT은 title·body만 허용하며 소유자를 변경하지 않으므로 기존 행과 새 행의 소유자가 유지됩니다. URL 신원 값과 본문의 owner_id·userId·role은 거부합니다. 타인/없는 행은 같은 404 JSON, 무로그인은 401 JSON입니다. 로그인 SDK·검증 도우미·메모 응답 계약·보안 헤더·aleph.json 생성·다른 도구는 보존했습니다. 실제 GET/POST 목록, GET/PUT/DELETE /:id 경로는 config와 일치합니다.

### 검토 후 SQL Editor에서 직접 실행

1. sql/step4-owners.sql: 예시 A/B 이메일을 실제 학습 계정 이메일로 바꾸세요. auth.users에서 ID를 찾고 기존 UUID fixture 앞 세 건은 A, 마지막 한 건은 B에 연결합니다. 계정 또는 fixture가 없으면 전체 작업을 취소합니다. 다른 메모는 수정하지 않습니다. 아직 적용하지 않았습니다.
2. sql/step4-permissions.sql: 적용 전후 role_table_grants와 has_table_privilege 결과를 비교합니다. anon의 모든 권한은 false, authenticated는 SELECT/INSERT/UPDATE/DELETE만 true여야 합니다. 테이블·칼럼의 기존 PUBLIC/anon/authenticated 권한과 이 테이블의 기존 정책을 회수하고 네 소유자 정책으로 교체합니다. UPDATE는 USING과 WITH CHECK를 모두 둡니다. 다른 테이블은 변경하지 않습니다. 실제 적용 전후 DB 조회는 미실행이며 결과를 꾸며 기록하지 않았습니다.

서버 전용 키는 RLS를 우회하므로 서버 API의 소유자 검사도 필수입니다. 직접 Data API 자기 점검은 세션 없는 공개 키의 anon 역할로만 실행합니다. authenticated 역할의 직접 접근은 점수/심판 재현 결과에 포함하지 않습니다.

로컬 검증: `node --test test/step4-owner.test.mjs`에서 타인 CRUD 차단, 본인 CRUD·삭제 후 404, 소유자 위조 거부의 모의 테스트 3건 통과. 실제 Supabase 인증·RLS 시험이나 심판 판정은 아닙니다. `npm run build -- --local` 통과. 커밋 후 `npm run bundle`은 실제 운영 응답을 별도 기록합니다.

직접 확인: A로 로그인해 세 메모 확인 및 새 메모 추가·수정·삭제 → 로그아웃 → B로 로그인해 본인 한 건과 CRUD 확인. 상대 UUID의 GET·PUT·DELETE는 404여야 하며 실패 요청 후 원본 자료가 그대로인지 확인하세요. 5단계 뒤에도 다시 확인합니다. 운영 A/B 시험, SQL 적용·권한 대조는 아직 미실행입니다. 옛 공개 커밋·배포의 과거 노출은 해소됐다고 주장하지 않습니다.

## 5단계 저장점 · 자료 요청을 서버 한곳으로 모읍니다

README와 마지막 4단계 저장점 1e2d930의 단계는 일치했고 작업 트리는 깨끗했습니다. 브라우저의 직접 메모 읽기/쓰기 호출: 없음. 따라서 public/app.js와 로그인(Auth) 호출은 수정하지 않았습니다. 메모 요청은 이미 GET/POST /api/notes와 GET/PUT/DELETE /api/notes/:id를 통해 서버로만 갑니다. 서버 코드와 환경변수·로그인 검증·소유자 검사는 그대로 보존했습니다.

서버 CRUD 확인: 기존 소유자 모의 테스트 3건 통과. 실제 A 계정 로그인 CRUD, B 타인 접근 거부는 계정·DB 적용 정보가 없어서 미실행입니다. 모의 테스트가 실제 정상 동작이나 심판 판정을 증명하지 않습니다. 권한 회수 전 실제 A로 로그인하여 메모 조회·추가·수정·삭제를 먼저 확인하세요.

### 검토 후 SQL Editor에서 실행

sql/step5-server-only.sql은 이 테이블의 PUBLIC·anon·authenticated 테이블/칼럼 권한만 회수합니다. 데이터, RLS와 기존 정책, 서버 역할, 다른 테이블은 바꾸지 않습니다. 적용 전후 role_table_grants, has_table_privilege를 비교하고 적용 후 has_any_column_privilege도 확인합니다. 두 직접 역할의 모든 권한은 false, service_role CRUD는 true여야 합니다. SQL은 아직 실행하지 않았고 실제 DB 권한 대조 결과도 미실행입니다. 기존 4단계 SQL을 재실행하면 authenticated 권한이 다시 생기므로 이 SQL을 마지막에 적용하세요.

originalApiUrl은 쿼리 없는 HTTPS 원본 경로 https://hzovkgmggfqoumxwbejm.supabase.co/rest/v1/vault_notes 입니다. 단계는 5이며 발급자·allowedRoutes는 그대로입니다. /aleph.json에도 allowedRoutes와 originalApiUrl을 빌드 시 기록합니다. 보안 헤더와 공개 JSON의 메모 0건은 유지합니다.

로그인(Auth) SDK 호출을 유지하라는 지시에 따라 브라우저 publishable key는 남아 있습니다. 따라서 '화면 코드에 공개 키 없음' 보너스는 미충족입니다. 공개 키 제거만으로 보안을 주장하지 않으며 실제 저장소 권한 회수가 필요합니다. 별도 로그인 프록시는 이번 요청에서 추가하지 않았습니다.

확인 순서: A 로그인 → 자기 CRUD 확인 → SQL 검토·실행 → 같은 A CRUD 재확인 → B 로그인 후 A 메모 개별 경로 404 → 시크릿 창 /api/notes 401 JSON → 공개 키만으로 원본 Data API 요청 시 401/403 및 자료 없음. 마지막 요청은 묶음 자기 점검이 anon으로 실행합니다. authenticated 직접 요청은 심판 점수에 포함하지 않습니다. 원본 404는 테이블 미설정 등 원인도 가능하므로 권한 차단 성공으로 계산하지 않습니다.

로컬 재실행: npm run build -- --local. 커밋 후 npm run bundle. 옛 커밋·배포의 과거 노출은 그대로 남습니다.

## 5단계 추가 점수 보완 · 브라우저 공개 키 제거

사용자의 90점→100점 보완 요청으로 Auth 호출도 /api/auth 서버 함수에 중계합니다. public/app.js에는 권한이 없는 SDK 자리표시자만 있고 실제 Supabase 공개 키는 서버 함수에만 있습니다. 이전 '공개 키 보너스 미충족' 기록은 이 변경 전 상태입니다. 공식 SDK의 global.fetch로 로그인·갱신·로그아웃 흐름을 유지하며 기존 세션 storageKey도 유지합니다. 비밀번호·JWT를 직접 만들거나 기록하지 않습니다. 인증 응답의 세션 토큰은 SDK가 처리하지만 API 키는 응답하지 않습니다.

서버 Auth 중계는 고정 프로젝트의 token(password/refresh_token), logout, user 경로만 허용하고 데이터·임의 URL을 중계하지 않습니다. 메모 API·소유자 검사·DB 설정·발급자·허용 메모 경로는 변경하지 않습니다. SUPABASE_SECRET_KEY는 이 Auth 중계에서 쓰지 않습니다. 제공된 공개 키는 서버 코드에만 두며 SUPABASE_PUBLISHABLE_KEY 환경변수로 대체할 수 있습니다. 추가 환경변수 등록 없이 기존 공개 키로 동작하도록 작성했습니다.

로컬 공식 SDK 모의 로그인 실패·키 삽입·임의 경로 거부, 기존 소유자 테스트 3건, 빌드·문법 검사 통과. public 정적 파일 공개/비밀 키 패턴 0건. 실제 A 로그인·갱신·로그아웃은 계정 시험 전까지 미검증이며 100점은 운영 심판 재제출로 확정합니다. 묶음은 /aleph.json 허용 경로 수, nosniff, 배포된 /와 /app.js 키 검색 결과를 기록합니다.

## 보너스 xdr-01 저장점 · 무차별 로그인 탐지

`npm run xdr:run -- brute-force`로 28개 학습 경보를 판정하고 result.json과 alerts.log를 생성합니다. read-alerts는 시각·주소·가상 계정·수준·설명만 추출합니다. MITRE T1110.001/T1110.003 패턴을 사용하며 수치 임계값은 학습용 설정입니다. 애매한 이벤트만 configureJev(adapter) 연결부로 전달하며 현재 Jev 서비스가 없어 alert로 대체합니다. 모델 판단만으로 차단하지 않습니다. 정상 이벤트는 record입니다.

서버/API와 기존 src/decider.mjs 규칙은 보존했습니다. src/xdr-decider.mjs의 decideWithXdr는 신뢰된 게이트웨이의 별도 sourceIp를 받아 만료 전 IP 거부 규칙을 적용한 뒤 기존 판정기를 호출합니다. 현재 운영 계약에는 IP가 없어 실제 엔진 연결은 미완료입니다. 기본 판정기는 starter.deny로 모두 거부하므로 정상 운영 통과를 주장하지 않습니다. 연결 테스트에서 허용하는 기준 판정기를 사용해 정상 요청 보존을 확인합니다. 기존 허용 이유 코드를 새로 등록하지 않아 XDR 거부에는 기존 starter_not_ready를 유지하고 ruleIds로 근거를 구분합니다.

차단 TTL은 경보 발생부터 15분이며 근거 경보 번호와 만료 시각을 보존합니다. 과거 fixture를 지금 실행하면 만료된 주소는 deny-rules.json에 넣지 않습니다. 운영 이벤트 수집과 Jev 호출, 배포, 심판 판정은 미검증입니다. 로컬 검증: node --test test/brute-force.test.mjs. 기존 자료실은 5단계이고 발급자·허용 경로·원본 API·judgeIssuer 설정은 변경하지 않았습니다. 화면에서는 기존 자료실 로그인/CRUD를 그대로 확인합니다. 이 XDR 시험은 CLI에서 실행합니다.

시험 결과: 경보 28건/추출 28행, block 10·alert 9·record 9, 정상 이벤트 block 0. XDR 및 기존 소유자 모의 테스트 총 6건 통과.

### xdr-01 심판 오류 보완

X01_CLEAR_NOT_BLOCKED 이후 명확한 실패 판단의 특정 한국어 문구 의존을 제거했습니다. T1110 분류·수준 10 이상·상관 실패 20건 이상·유효 IP/시각으로 판단하며 표준 Wazuh mitre.id 배열도 받습니다. 임계값은 학습용이며 운영 튜닝이 필요합니다. 공개 fixture는 여전히 10/9/9로, 심판 비공개 정답표는 확인할 수 없습니다. 문구가 다른 고수준 실패와 낮은 횟수 경보의 회귀 시험을 추가했습니다.

### xdr-01 독립 실행 보완

판정 입구에서 파일 읽기·Node 모듈·최상위 await 의존성을 제거했습니다. 의존 파일 없는 격리 실행에서도 명확한 공격을 판단합니다. Jev는 TypeSafe System One 모델입니다. 공식 HTTP API의 jev.mjs를 추가했으며 서버의 TYPESAFE_API_KEY가 있을 때만 애매한 경보를 전송합니다. 키 없음/통신 실패는 alert입니다. 실제 API는 미호출이며 첨부 TypeSafe 스킬과 공식 API·문서 목록을 읽어 적용했습니다.

## 보너스 xdr-02 저장점 · 웹 주입 공격 탐지

실행: `npm run xdr:run -- web-injection`. 원본 fixture 26건은 보존했고 읽기 모듈의 추출도 26행입니다. SQL·스크립트·경로 이탈·명령 주입의 MITRE T1190 패턴을 기록했습니다. 수준 10 이상·T1190·상관 반복 5회 이상 및 주입 근거를 함께 요구합니다. 임계값은 학습용 정책입니다. 단발성 또는 애매한 이벤트는 alert, 정상 조회는 record입니다. URL은 제한된 길이에서 두 번까지만 디코딩하고 로그에는 저장하지 않습니다.

독립 decide.mjs는 최상위 import 없이 판정할 수 있습니다. TypeSafe 스킬을 적용했고 Jev는 서버 TYPESAFE_API_KEY가 있을 때만 애매한 경보의 정제 설명을 공식 API로 평가합니다. 미설정·실패는 alert이며 모델 판단만으로 단발 요청을 차단하지 않습니다. 실 API 호출은 미실행입니다.

연결부는 근거 경보 번호와 발생 시각부터 15분 만료 규칙을 만들고 alerts.log에 한 줄씩 기록합니다. 과거 시험 경보는 현재 차단 목록에 넣지 않습니다. src/xdr-decider.mjs는 두 XDR 모듈의 거부 규칙을 합친 뒤 기존 판정기를 호출합니다. src/decider.mjs 및 기본 규칙, 자료실 API·DB·5단계 설정은 변경하지 않았습니다. 운영 계약에 IP가 없어 실제 엔진 IP 연결은 여전히 미완료입니다. 허용하는 기준 판정기와 경보 당시 시각을 이용한 연결 시험에서 명확한 공격만 거부되고 정상 요청은 보존됐습니다.

로컬 결과: block 8·alert 9·record 9, 정상 이벤트 block 0. 독립 실행·연결·기존 XDR·메모 소유자·실행기 테스트 총 15건 통과. 심판 판정은 재제출로 확인해야 합니다. 기존 무차별 로그인 결과 10·9·9도 유지됩니다. 웹 화면에서 XDR 시험 버튼은 없으며 CLI 명령으로 확인합니다. 제출 포털에서 web-injection 보너스에 같은 GitHub 저장소를 제출하세요.

## 6단계 저장점 · 등록한 기기만 자료실에 들어옵니다

이전 기록과 마지막 저장점은 xdr-02이며 자료실 단계는 5로 일치했습니다. src/decider.mjs에 device_registered 규칙을 추가했습니다. subjectId는 엔진이 검증한 가명 사용자 ID이고 deviceRegistered는 최상위 등록 여부입니다. 인증·기기 소유자 결합·mTLS 검증은 운영 엔진이 수행하며 학생 판정기가 인증서를 만들거나 브라우저의 신원 주장을 신뢰하지 않습니다.

등록 여부가 정확히 true인 notes 서비스의 GET /notes 또는 GET /notes/:id 읽기만 allow·approved입니다. 미등록·누락·잘못된 타입은 deny·device_not_registered입니다. 읽기 범위 밖에는 기존 starter.deny 거부를 유지했습니다. 응답 다섯 항목과 기존 XDR 연결·API·화면·DB는 보존했습니다. 단계만 6으로 올리고 발급자·허용 API 경로·원본 API·judgeIssuer는 유지했습니다. 새 인증서·CA·개인키를 만들지 않았고 별도 접속 프로그램 설치도 없습니다.

확인 순서: npm run decider:test 실행 → 등록 기기의 정상 요청 통과 → 미등록 기기의 가상 요청 통과(deny·device_not_registered) 확인. 이어 node --test test/step6-device.test.mjs로 누락·문자열·읽기 외 요청 거부를 확인합니다. 이 결과는 가상 요청의 로컬 시험이며 심판의 mTLS·미등록 기기 공격 통과 증거가 아닙니다. 실제 등록 기기의 화면 열기와 심판의 공격 판정은 제출 후 확인해야 합니다. 기존 웹 화면에서 로그인과 자기 메모 읽기를 확인하세요.

## 7단계 저장점 · 평소와 다른 접속은 다시 확인합니다

6단계 기록과 마지막 커밋이 일치했고 작업 트리는 깨끗했습니다. 기존 기기 규칙을 유지하고 step_up_required 규칙을 추가했습니다. 입력은 계약의 signals·recentEvents·stepUp만 사용하며 클라이언트 헤더·토큰 원문을 읽거나 기록하지 않습니다. judge_fixture 출처에서 local/foreign, usual/unusual, 0~23의 정수 시각 및 사건 배열을 검사합니다. 누락·불명확한 출처·잘못된 값은 정상값으로 보정하지 않고 step_up으로 보냅니다. 실제 source none/region unknown/network unknown은 위치 정보 미제공으로 구분하고 가상 위치 규칙을 적용하지 않습니다.

가상 신호는 foreign 지역, unusual 네트워크, 23~05시, 최근 300초 이내 risk_signal 10건 이상 중 둘 이상 겹칠 때 step_up·step_up_required입니다. 지역 하나만으로 영구 차단하지 않습니다. verified true 및 정수 authAgeSeconds 0~900의 엔진 검증 가상 재인증 뒤에는 기존 읽기 허용 규칙으로 다시 판정합니다. 미등록은 재인증 여부와 관계없이 거부됩니다. 응답 다섯 항목·기존 XDR·브라우저·DB·API를 보존했습니다.

확인: npm run decider:test → 등록 정상 allow, 미등록 deny, 복합 이상 step_up, 재확인 복합 allow. npm run fixture:7 → 정상 allow, 복합 이상 step_up. node --test test/step7-context.test.mjs → 출처 위조·누락·재인증 만료·지역 단독 검증. 이는 가상 시험입니다. stepUp 전달 계약은 있으나 저장소에 제공 엔진의 실제 새 로그인 시각 검증·릴레이 구현이 없으므로 실제 추가 확인 전 자료 차단과 재로그인 후 허용 실측은 미실행입니다. 기존 사이트는 그대로이며 제공 엔진이 연결된 환경에서만 실제 재로그인 확인을 시험해야 합니다.

## 8단계 저장점 · 자료 구역 규칙

판정기는 계약의 사용자·등록 기기·서비스·메서드·정확한 경로를 확인합니다. 메모 단건 GET·PUT·DELETE, 반 공지 단건 GET만 허용 후보입니다. 메모 전체 목록, 공지의 모든 쓰기, 강사 자료, 기능 경로, 알 수 없는 경로와 쿼리 요청은 거부합니다. 메모 ID는 UUID로 제한하지 않습니다. 기존 기기 등록과 복합 이상 접속의 추가 확인 규칙은 유지합니다.

요청 계약에 역할이나 메모 소유자가 없으므로 판정기에서 임의의 소유자 연결표나 강사 역할을 만들지 않습니다. 실제 자료 API는 검증된 로그인 사용자와 DB에 저장된 소유자를 대조하고, 공지 관리 API는 DB의 강사 권한을 확인합니다. 공지 관리 쓰기는 판정기 허용 경로에 포함하지 않습니다. 기존 화면·자료·주소는 보존합니다.

확인: `npm run decider:test`, `node --test test/step*.test.mjs`, `npm run bundle`. 정상 등록 기기의 단건 메모 요청은 allow, 미등록 기기는 device_not_registered, 복합 이상은 step_up입니다. 공지 쓰기·강사 자료·메모 목록은 deny이며, 다른 사람의 단건 메모는 API에서 거부합니다. 로컬 가상 시험은 실제 심판 결과나 로그인한 배포 환경의 실측이 아닙니다.

## 9단계 저장점 · 탐지와 회수 제안

src/detect.mjs는 docs/DETECT_EVENTS.md의 제공된 로컬 사건 계약을 사용합니다. 시각·GET 여부·가명 identity.sub만 골라 사용자별로 정렬하고 이동하는 10분 구간을 계산합니다. 120건은 observe, 121건부터 propose_revocation·burst_read·해당 subject를 반환합니다. 사용자끼리 합산하지 않으며 입력은 변경하지 않습니다. 메모 내용·토큰·실명은 저장하거나 출력하지 않습니다. 결정 응답과 6~8단계 규칙은 그대로 유지합니다.

확인: `npm run detect:test`에서 정상 30건·120건·사용자별 100건·시간 밖 사건은 observe, 121건·200건은 회수 제안입니다. `node --test test/step9-detect.test.mjs`는 10분 경계·역순·입력 보존·잘못된 사건·사용자 분리를 검증합니다. `npm run decider:test`로 기존 판정 규칙을 확인하고 `npm run bundle`로 제출합니다.

계약 한계: 제공된 사건에는 네트워크·기기 ID·판정이 없고 응답 대상도 subject입니다. 임의의 기기 ID나 네트워크를 만들지 않았습니다. 네트워크와 다량 조회의 복합 사건, 기기 한 개 지정, 실제 회수·회수 뒤 차단·경과 시간 측정은 운영 엔진/심판 계약과 집행 환경에서 확인해야 하며 이 로컬 연습으로 실측했다고 보고하지 않습니다. 회수 API·기기 권한 변경은 구현하지 않았습니다.

## 10단계 저장점 · 검증한 백업에서 한 건 복구

9단계 저장점 e0f6ded8380a8c9e30351c6584d6125612c61758의 판정기 사본을 recovery/safe-decider.mjs에 보존했습니다. policy-manifest.json의 버전·SHA-256을 복원 도구의 고정 값과 대조하며, 사본 누락·변조·검증 실패면 중단합니다. 실제 src/decider.mjs와 다른 서비스 규칙은 변경하지 않습니다.

시험 정책 절차: `node scripts/restore-policy.mjs init`으로 시험 파일을 한 번 생성합니다(기존 시험 파일 덮어쓰기 금지). `node scripts/restore-policy.mjs`로 버전·바뀔 줄·전후 해시를 확인합니다. `node scripts/restore-policy.mjs apply <beforeSha256> <afterSha256>`은 확인한 두 해시가 같을 때만 artifacts/test-policy.mjs를 복원합니다. 감사 이력은 artifacts/policy-recovery-audit.jsonl에 추가하며 삭제하지 않습니다. 시험 폴더와 감사 파일은 Git에 올리지 않습니다.

DB 준비는 필수입니다. Supabase SQL Editor에서 sql/step10-recovery.sql을 침해 시험 전에 한 번 실행하세요. 현재 메모가 안전한 상태인지 먼저 확인하세요. 이 SQL은 서버 전용 vault_recovery 스키마에 비공개 최초 사본과 해시를 저장하고, 이후 새 메모의 최초 INSERT만 백업합니다. UPDATE·DELETE는 사본을 바꾸지 않고, 재실행도 기존 사본을 덮어쓰지 않습니다. 백업 내용은 Git·정적 public·응답·로그에 내보내지 않습니다. 기존 비로그인/학생 Data API 차단과 다른 테이블 권한은 유지합니다.

복구 서비스: 자료실 서버의 별도 복구 관리 경로 **POST /api/restore**. aleph.config.json의 restoreRoute도 /api/restore입니다. 요청 JSON은 `{ "id": "복원할 메모 UUID" }` 한 항목입니다. 검증된 심판 토큰의 시험 신원 B만 허용하고 A·일반 학생·익명·위조 역할·소유자 입력은 거부합니다. 기존 Vercel SUPABASE_URL·SUPABASE_SECRET_KEY를 사용하며 새 키를 만들지 않습니다. 소유자는 검증된 B 신원에서 결정합니다. 단건 백업 ID·소유자·내용 SHA-256을 검증하고 한 건만 원자적으로 복원한 뒤 결과 해시를 다시 검사하고 DB 감사 이력을 추가합니다. 사본 없음·해시 불일치·다른 소유자이면 중단합니다. 복구 경로는 일반 메모 접근 허용 목록에 추가하지 않습니다. 실제 복구는 SQL 준비 후 심판이 B 메모 변조·삭제로 확인합니다.

재시험 순서:
1. `npm run decider:test` — 등록 정상 허용, 미등록 거부, 복합 이상 추가 확인, 재확인 허용.
2. `npm run detect:test` — 정상 유지, 시간·사용자 분리, 120건 초과 회수 제안.
3. `node --test test/step*.test.mjs` — A 정상 CRUD, B의 A 자료 거부, 역할 위조 거부, 복구 인증·정책 보존.
4. `node --test test/r5.test.mjs test/brute-force.test.mjs test/web-injection.test.mjs test/xdr-run.test.mjs` — 로그인·기존 보너스 방어 회귀.
5. `npm run bundle` — 비로그인 자료 차단, 원본 anon 차단, 정적 자료 비공개, 배포 단계와 화면 키 검사.
6. DB SQL 실행 뒤 과제의 「심판에게 제출하기」 — B 메모 변조/삭제 복원, 복원 해시 일치, 복구 직후 1~9단계 공격 재전송 확인.

검증 결과: 관련 Node 시험 34개, 기존 판정기 4개·탐지 계약 6개, 새 npm install이 통과했습니다. 별도 로컬 PostgreSQL(PGlite)에서 SQL을 실제 실행하여 변조·삭제 복원, 소유자 경계, 해시 변조 거부, 다른 메모·감사 보존을 검증했습니다. 로컬 DB 시험과 실제 Supabase/심판 시험은 구분합니다. SQL 적용·운영 B 복원·접속 회수 이후 차단은 이 환경에서 미실행이며 결과를 꾸미지 않습니다. 공개 백업이나 현재 변조 자료로 원래 내용을 추정해 복구하지 않습니다.

### S10_RETEST_MISSING 수정 · 복원 직후 실행과 결과 기록

이전 버전은 복원 후 재시험 순서를 설명했지만 복구 경로에 실행을 연결하지 않았습니다. 이제 POST /api/restore의 DB 복원이 끝나면 실제 notes API handler를 다시 실행하여 B 본인 단건 읽기(200 및 저장된 복원 내용 일치), 익명 읽기(401), 위조 소유자 쓰기(403), 다른 소유자 메모 읽기(404)를 검사합니다. 결과는 retest 배열의 이름·HTTP 상태·passed로 반환합니다. 하나라도 실패하면 restore_retest_failed와 502를 반환하여 재시험 실패를 성공처럼 처리하지 않습니다. 다른 소유자 메모가 없으면 해당 건은 passed:null 및 not_run으로 명시합니다. 토큰·메모 본문은 결과에 남기지 않습니다.

`node scripts/recovery-retest.mjs`는 검증된 시험 정책 복원 직후 1~9단계 관련 정상·금지 API/판정기/탐지 회귀 시험을 다시 실행하고 artifacts/recovery-retest.json에 로컬 실행 시각·실행 여부·통과 여부를 기록합니다. 현재는 `npm run recovery:retest`로 이 절차를 별도 실행합니다. 제출 묶음에는 익명 HTTP 점검의 실제 결과만 기록하며 로컬 시험을 운영 실측으로 계산하지 않습니다. 이 결과는 로컬 모의 시험이며 운영 계정 시험으로 바꿔 적지 않습니다. 운영 B의 복원 후 API 시험은 심판이 복구 경로를 호출할 때 실행됩니다. 기존 DB 사본과 복구 SQL은 바꾸지 않습니다.

## 11단계 저장점 · 설치형 접속 앱과 기기 승인

10단계 기록과 마지막 커밋 483f3020c322가 일치하며 다른 작업은 없었습니다. 기존 판정기·탐지·복구와 메모 소유자 검사는 보존했습니다. manifest.webmanifest, 192/512 PNG 아이콘, 오프라인 안내를 추가했습니다. 서비스 워커는 공개 offline.html 안내만 캐시하며 API·메모·토큰은 캐시하지 않습니다. 별도 접속 프로그램은 없습니다.

Supabase SDK는 persistSession:false이며 토큰은 메모리에만 보관합니다. 기존 SDK 저장 토큰 항목은 제거합니다. 기기 개인키는 Web Crypto의 내보낼 수 없는 ECDSA P-256 키로 생성해 메모리에만 둡니다. 브라우저 저장소·IndexedDB·쿠키·캐시에 키를 넣지 않습니다. 공개키만 POST /api/device로 보내며 서버는 인증된 사용자에 연결한 pending 요청만 등록합니다. 버튼·앱 설치로 승인되지 않습니다.

필수 DB 준비: Supabase SQL Editor에서 sql/step11-app-devices.sql을 한 번 실행합니다. 화면에서 로그인 → 「기기 승인 요청」 → 표시된 기기 ID와 DB의 owner_id를 대조합니다. 관리자가 SQL의 주석 승인 예시를 복사하고 확인한 ID·owner_id로 교체해 해당 pending 한 행만 approved로 변경합니다. 「승인 상태 확인」을 누르면 승인된 기기의 기존 자료실이 열립니다. 관리자 SQL 이외에 공개 승인 경로는 없습니다. revoked로 바꾸면 이후 보호 요청은 거부됩니다.

POST/GET /api/device는 등록 요청과 상태 확인용이며 보호 자료를 반환하지 않습니다. 실제 메모·공지 API는 매 요청에서 사용자와 승인 공개키의 결합, ECDSA 서명, 메서드·원래 정확한 URL·JSON 본문 SHA-256·60초 시각·일회용 nonce를 확인합니다. 서명 누락·경로/본문 변경·nonce 재사용은 거부됩니다. 동적 API 파일을 사용해 서명한 원래 경로를 유지하고 이전 URL 재작성은 제거했습니다. 판정기에서는 기존 deviceRegistered 규칙을 유지하며 앱 등록표와 엔진 등록표를 임의로 동일시하지 않습니다.

서버 내부 복구 재시험은 서명 검증된 심판 B에 한해 HTTP에서 만들 수 없는 Symbol 문맥으로 기존 API 검사를 실행합니다. 외부 요청은 이 문맥을 만들 수 없으며 복구 관리자 경로는 기존 B 인증과 백업 검증을 유지합니다. 기존 소유자 시험은 기기 검사를 별도 의존성으로 분리했고, step11 시험은 실제 서명 검사·승인 상태·재사용 및 실제 자료 API의 서명 누락 거부를 검사합니다.

확인: `node --test test/step*.test.mjs test/recovery-retest.test.mjs`, `npm run decider:test`, `npm run detect:test`, `npm run bundle`. 승인 전 workspace는 숨겨지고 자료는 비어 있습니다. 오프라인에서는 자료를 비우고 안내만 표시합니다. 새로고침·로그아웃으로 메모리 키가 사라지므로 다시 등록/승인이 필요합니다. 실제 관리자 승인 및 로그인한 브라우저 CRUD는 SQL 적용 후 확인하며, 미실행을 통과로 기록하지 않습니다.

## 12단계 저장점 · 탈환 작전실

이어받기 기준 3a609f6bd009(11단계), README·단계 설정·마지막 커밋 일치, 작업 트리 변경 없음. 기존 보호 경로와 판정·탐지·복구를 보존합니다. 이 절의 검사 대상은 이 절을 포함한 `git rev-parse HEAD` 저장점이며 제출 JSON의 commit과 대조합니다.

작전실: 로그인 → 기기 승인 → 「서버 기록 확인」. GET /api/operations는 로그인 및 매 요청의 승인 기기 서명을 검사하고 자기 기기 상태별 실제 DB 건수·자기 복구 감사 건수와 마지막 시각·판정기 규칙 목록·사본 버전을 반환합니다. 메모·소유자 ID·토큰·공개키·본문은 반환하지 않습니다. 먼저 sql/step12-operations.sql을 SQL Editor에서 적용하세요. 집계 함수는 service_role만 실행할 수 있고 API가 검증한 소유자 범위만 사용합니다. SQL 미적용·DB 오류는 unavailable이며 0건 성공으로 바꾸지 않습니다. 탐지 사건 수집과 엔진 신원 회수 기록은 현재 미연결로 표시합니다. 기기 revoked 건수와 엔진 신원 회수는 별개입니다. 사본 버전은 설정 메타데이터이며 실제 복구 실행의 증거가 아닙니다.

「정상·금지 요청 실측」은 실제 배포된 메모 API에 서명한 본인 목록(GET 200), 익명 목록(GET 401), 로그인했으나 서명 없는 목록(GET 403)을 보내고 기대·실제 HTTP·요청 ID·확인 시각을 한 표에 표시합니다. 본문은 읽거나 시험표에 저장하지 않습니다. 화면 성공 문구만으로 시험을 통과시키지 않습니다. 나머지 41종 공식 공격은 공식 심판 결과가 없으므로 번호별 미실행 슬롯입니다. 이 슬롯은 공격 이름·실행 근거를 꾸민 목록이 아닙니다. 화면 새 조회·오류·회수·로그아웃·오프라인 때 이전 시험표를 지우며 결과를 지속적으로 보존했다고 주장하지 않습니다.

### 1~11단계 재현 표 작성 절차

각 실제 시험을 동일한 제출 커밋에 수행하고 표의 열을 `단계 | 정상/금지 요청 | 기대 | 실제 API 상태 | 서버 요청 ID | 확인 시각 | 실행 상태 | 범위`로 기록합니다. 운영 시험 계정과 승인 기기가 준비되지 않은 건은 미실행으로 둡니다. 로컬 모의 시험은 실제 배포 API 시험으로 옮겨 적지 않습니다. 메모 본문·토큰·비밀번호는 표에 넣지 않습니다.

| 단계 | 정상 기대 | 금지 기대 | 운영 확인 방법 |
|---|---|---|---|
| 1~2 | 정적 앱 200, 공개 메모 0건 | 공개 파일에 비밀값 없음 | bundle의 배포 파일 점검 |
| 3 | 유효 로그인 본인 200 | 무인증 401 | 작전실 실측 + 정상 로그인 |
| 4~5 | 승인 A 본인 CRUD 200/201 | 승인 B의 A 단건 GET/PUT/DELETE 404, 원본 직접 요청 401/403 | A/B 실제 계정으로 각각 수행; 아직 미실행 |
| 6 | 엔진 등록 기기 allow | 미등록 deny | 공식 엔진 시험; 로컬 decider 시험과 구분 |
| 7 | 재확인 정상 allow | 복합 이상 step_up | 공식 엔진 시험; 아직 미실행 |
| 8 | 메모 단건·공지 읽기 allow | 목록·공지 쓰기·구역 밖 deny | 공식 엔진 시험; 아직 미실행 |
| 9 | 정상 observe | 121건 burst 회수 제안, 실제 회수 후 거부 | detect:test는 로컬; 운영 회수 미연결 |
| 10 | B 복원·해시 일치·본인 읽기 200 | 타인 복원 거부·재시험 금지 요청 거부 | 공식 B 복구 호출 후 retest 응답; 감사 집계 확인 |
| 11 | 승인 서명 요청 200 | 무서명 403, 경로/본문 변경 403, 재사용 403 | 작전실 무서명 실측; 나머지는 승인 계정 시험 필요 |

### 설치·실행·중지·복구 및 출처

엔진 출처: **ALEPH SDP 엔진 사용**. 운영 엔진의 로그인/등록 신원 전달·mTLS·총공세 집행은 제공 영역이며 이 저장소에서 만들었다고 주장하지 않습니다. 학생 작업은 src/decider.mjs 규칙, src/detect.mjs 탐지 제안, 접속 앱 public, 자료실 api, 검증 사본 복구 및 작전실입니다. 운영 회수 집행 미연결은 한계로 남깁니다.

1. `git clone https://github.com/rnjswnghl/choi-bujang-secret-vault` → 해당 폴더에서 `git checkout <제출 JSON commit>` → `npm install`.
2. 비밀값은 Vercel 공식 환경 설정에 직접 등록합니다. `.env`, 토큰, 개인키, 메모 사본은 Git·묶음에 넣지 않습니다. README의 기존 4/5/10/11 SQL 순서를 검토하고 12 집계 SQL을 적용합니다. 기존 백업을 덮어쓰지 않습니다.
3. `npm run build -- --local`; `node --test test/step*.test.mjs test/recovery-retest.test.mjs`; `npm run decider:test`; `npm run detect:test`. 모두 로컬 시험입니다.
4. 저장소의 Vercel 배포에서 해당 commit을 확인하고 로그인·기기 요청·관리자 단건 승인·승인 상태 확인·작전실 실측을 수행합니다. 엔진은 제공된 과제 환경에서 실행하며 별도 프로그램을 설치하지 않습니다.
5. 중지: 브라우저 로그아웃으로 메모리 키·토큰을 제거하고 관리자가 해당 기기 한 건을 revoked로 바꿉니다. 서비스 전체 중지는 Vercel 공식 배포 관리에서 수행합니다. 다른 기기를 일괄 회수하지 않습니다.
6. 복구: 10단계 정책 preview/apply의 해시 확인 순서, B 단건 POST /api/restore와 복구 직후 재시험을 따릅니다. 감사 기록과 다른 메모는 보존합니다. 11단계 서명 요구를 해제하지 않습니다.
7. `npm run bundle`의 commit·step·점검 범위를 대조하고 같은 저장소/배포를 공식 심판에 제출합니다. 41종 실제 결과는 심판 판정으로 확정합니다.

### 12단계 제출 실행기 재점검 · 현재 방식

마지막 제출 c96e2ef7428f에서도 runner_import_failed가 반복됐습니다. 지난 수정은 HTTP 모듈의 의존성을 묶음 실행기에 옮기고 함수에 두 번째 인자를 추가했으므로 제거가 완전하지 않았습니다. 심판 내부 로더는 공개돼 있지 않아 그 정확한 실패 지점은 확정하지 않습니다. 현재는 시작 틀의 `runAttackChecks(config)` 한 인자 계약과 `scripts/bundle.mjs`의 원래 호출 구조를 복구했습니다. 제출 경로에는 추가 복원 실행기 import·콜백·파일/자식 프로세스 시험을 넣지 않습니다.

- `npm run bundle`: 실제 배포에 보낸 익명 HTTP 점검만 기록합니다. 계정 A/B 시험과 복구 실행·공식 41종 시험은 미실행입니다. 하드코딩한 로컬 통과 문구를 없앴습니다.
- `npm run recovery:retest`: 검증된 시험 정책 복원, 정상/금지 판정 8개와 기존 API·서명·소유자 회귀 26개를 로컬에서 별도 실행합니다. artifacts/recovery-retest.json에 local_simulation 범위로 남기며 운영 API 실측으로 옮겨 적지 않습니다. 실제 POST /api/restore와 복구 직후 API 재시험 연결은 유지합니다.
- `npm test`: 기존 보너스 포함 전체 test/*.test.mjs 실행. 오래된 시작 틀 패키징 검사는 출처 기준표를 보존하면서 현재 추가한 서버 함수 목록도 검사하도록 갱신했습니다.
- `node --test test/step12-runner.test.mjs`: 외부 파일 없는 data URL과 process/require 없는 VM에서 원래 한 인자 entry를 가져와 실행합니다. 잘못된 JSON, 네트워크 실패, 금지 요청의 예상 밖 200, 서버 요청 ID 누락을 시험합니다. 이 격리 시험이 비공개 심판 로더와 동일하다고 주장하지 않습니다.
- `node --test test/step12-ui.test.mjs`: 실제 public/app.js를 모의 DOM·Auth·HTTP로 실행하여 승인 전 차단, 서버 집계와 표시 일치, 실패/회수/로그아웃/오프라인 뒤 이전 결과 제거, 서버 요청 ID 표시를 확인합니다. 실제 계정 브라우저 시험과 구분합니다.

작전실은 집계가 빠지거나 값이 잘못됐을 때 실행 성공/0건으로 표시하지 않습니다. 복구 RPC 응답에서 restoreCount·lastRestoreAt만 선택해 표시하며 추가 필드와 본문은 전달하지 않습니다. 사본 버전은 configured_backup_metadata로 표시하고 실제 복구 검증 성공으로 취급하지 않습니다. 서버가 401/403을 반환하면 남아 있는 자료와 작전실 기록을 지우고 승인 상태를 다시 확인해야 합니다. 이번 수정은 DB 자료·정책·감사 이력과 제공 엔진의 발급자 설정을 변경하지 않습니다.

재현 순서: 해당 제출 커밋을 새로 받기 → `npm install` → `npm test` → `npm run decider:test` → `npm run detect:test` → `npm run recovery:retest` → `npm run build -- --local` → 공식 Vercel 환경에서 배포 커밋 대조 → `npm run bundle`. bundle-notes.json은 로컬에서 설명을 작성하며 Git/제출 소스에 비밀값을 포장하지 않습니다. 화면에서는 로그인/기기 승인 뒤 서버 기록 확인과 정상·금지 요청 실측을 누릅니다. 정상 서명 요청 200, 익명 요청 401, 로그인했으나 서명 없는 요청 403이 기대 결과입니다. 41종 점수와 S12_SCREEN_MISMATCH 최종 통과는 공식 재판정으로 확인합니다.

### S12_BUNDLE_UNSUPPORTED · GET/HEAD 전용 제출 점검

심판이 명시한 격리 환경의 요청 계약은 공개 HTTPS에 대한 GET·HEAD만 허용합니다. 제출 점검에 남아 있던 익명 POST /api/restore를 제거했습니다. 쓰기·복구 실행·A/B CRUD·공식 41종 시험이 필요한 점검은 observed를 정확히 `not_run`으로 기록합니다. 이는 거부 성공이나 시험 통과가 아니라 미실행입니다. 복구 API 자체와 이전 보안 규칙은 변경하지 않습니다.

`NODE_OPTIONS='--import=./scripts/bundle-readonly-guard.mjs' npm run bundle`로 전체 명령을 읽기 전용 요청 가드 아래 실행합니다. 가드는 금지 요청을 runner가 catch하더라도 마지막 종료 코드를 실패로 만듭니다. `requests`는 실제 fetch 시도 수이고 `blocked=0`이어야 합니다. test/step12-runner.test.mjs는 1~12단계 각각에서 GET/HEAD만 시도하는지 검사합니다. test/step12-bonus-contract.test.mjs는 단계 12 이상, 문서의 18개 이름만 읽는지, 360개 가상 요청의 응답 5개 필드와 RULE_IDS를 검사합니다. 이 가상 조합은 공식 41종 공격이 아닙니다.

직접 확인: 승인된 계정으로 「서버 기록 확인」에서 API 집계와 표시를 비교하고 「정상·금지 요청 실측」에서 서명 정상 200·무인증 401·무서명 403을 확인합니다. 조회 실패·회수·로그아웃 시 이전 기록은 사라져야 합니다. 공식 41종 결과 없는 항목은 미실행이고 엔진 출처는 ALEPH SDP 엔진 사용입니다. 실제 운영 A/B와 41종 판정은 이 환경에서 완료됐다고 주장하지 않습니다.

### 실행 기록 대조 · 공식 문서의 요청 지문 형식

지난 b83dbaf555d3의 임의 fetch 옵션과 x-aleph-attack-id/x-attack-id 헤더 방식은 심판에서 인정되지 않았습니다. 이 방식과 이를 근거로 한 ID 대조를 제거했습니다. 공식 공개 12단계 채점표의 5절은 observed가 `HTTP 401`, `bodyBytes=`, `jsonArrayLength=`, `jsonReady=`, `method=`, `urlSha256=` 또는 `not_run` 같은 확인 가능한 형식이어야 한다고 명시합니다.

정본 안내: https://aleph-omega.vercel.app/docs/defense/judge-rubrics/stage-12.md

현재 모든 실측 행은 실제 응답에서 `HTTP 상태; method=GET; urlSha256=<실제로 보낸 정규화 URL의 SHA-256>; bodyBytes=<실제 응답 UTF-8 바이트 수>`를 기록합니다. 서버가 준 요청 ID와 확인 시각도 함께 적으며, 본문은 적지 않습니다. 빈 메모 수·배포 단계·보안 헤더·manifest·화면 파일 키 패턴은 실제 응답을 읽어 확인한 값만 보충합니다. 화면 HTML/JS는 각각 한 점검 행과 한 요청으로 나눴습니다. 공개 HTTPS GET/HEAD만 허용하며 쓰기·복구·공식 41종은 not_run입니다.

독립 기록 도구는 fetch 시점의 실제 URL 지문·메서드와 실제 응답 상태·바이트 수를 따로 수집하고 제출 결과의 같은 네 값과 대조합니다. 동일한 이름을 양쪽에 임의로 채워 일치했다고 판정하지 않습니다. `NODE_OPTIONS='--import=./scripts/bundle-readonly-guard.mjs' npm run bundle` 종료 시 blocked=0, unmatched=0을 확인합니다. 그 결과는 로컬 독립 기록 대조이며 심판의 대조 완료라고 주장하지 않습니다. 당시에는 ID 연결 규약을 확인하지 못했습니다. 아래 공식 표본 계약 확인 절이 현재 구현입니다.

### 실제 원인 수정 · 공식 alephEvidence 요청 연결

심판에서 반복된 「그 attackId로 보낸 요청 기록이 없음」의 원인은 fetch의 공식 사례 연결 메타데이터 누락입니다. 제공자의 공식 표본 `ChoiTimo/byteback-sample-pass`에서 2026-10-11 수정된 README와 src/attack-check.mjs를 확인했습니다. 요청에는 `alephEvidence: {caseId: attackId, requestKey: 'read'}`를 전달합니다. 이 메타데이터는 HTTP 헤더/URL에 넣지 않습니다. 기존 starter의 3필드 결과 계약은 그대로 유지하며, 표본의 다른 보안 구현·API·DB를 가져오지 않습니다.

출처: https://github.com/ChoiTimo/byteback-sample-pass/blob/main/src/attack-check.mjs
안내: https://github.com/ChoiTimo/byteback-sample-pass/blob/main/README.md

모든 실측 행은 동일 caseId의 실제 GET 요청과 연결됩니다. observed에는 실제 상태·메서드·URL 지문·바이트 수·서버 요청 ID·시각만 남깁니다. 독립 가드는 fetch 시점에 공식 caseId/requestKey를 수집하고 같은 attackId의 실제 응답과 일대일로 대조합니다. caseId 누락·잘못된 사례·잘못된 requestKey·쓰기 요청은 runner가 catch해도 검증 실패입니다. 쓰기·복구·A/B·공식 41종은 실제 미실행이라 not_run으로 남기며 연결 요청을 만들어내지 않습니다. 이전 로컬 URL 지문 대조만 통과했다고 심판 ID 대조까지 성공한 것으로 안내한 것은 잘못된 검증 범위였습니다.

확인 명령: `npm test` 및 `NODE_OPTIONS='--import=./scripts/bundle-readonly-guard.mjs' npm run bundle`. 같은 커밋에서 모든 공식 사례 연결과 관측값이 일치하고 blocked/unmatched가 0인지 확인합니다. 심판 최종 판정은 재제출로 확인합니다.

### observed 허용 목록 제한

a2e717018820의 공식 사례 연결은 인식됐으나 observed에 requestId·checkedAt·notesCount·step·nosniff·standalone·keyPatternsFound를 붙여 불합격했습니다. 이번에는 observed 전체를 `HTTP <상태>; method=GET; urlSha256=<64자리 SHA-256>; bodyBytes=<정수>` 네 관측값 또는 정확한 `not_run`으로 제한합니다. 추가 설명·성공 문구·다른 필드는 붙이지 않습니다. request ID/시각은 별도 로컬 감사 기록과 기존 작전실 표에만 남기고 observed에는 넣지 않습니다. 공식 alephEvidence 사례 연결과 GET·HEAD 제한은 그대로 유지합니다.

시험과 독립 가드는 전체 문자열에 시작/끝 앵커를 적용합니다. 허용된 네 값 뒤에 잘못된 필드나 문장을 하나라도 붙이면 검증 실패입니다. 부분 문자열만 맞으면 통과시키던 로컬 검증을 수정했습니다. 실제 응답에서 얻은 숫자만 기록하며 쓰기·복구·A/B·공식 41종은 not_run으로 남깁니다.

## 보너스 xdr-03 저장점 · 알려진 취약점 악용 탐지

`npm run xdr:run -- known-cve`로 원본 Wazuh 형식 시험 경보 24건을 실행합니다. 확인용 `read-alerts.mjs`는 시각·출발 주소·가상 계정·수준·설명만 추출하며 비밀값 형태를 가립니다. 원본 fixture는 변경하지 않았습니다.

`patterns.json`의 근거는 NVD CVE-2021-44228 및 MITRE ATT&CK T1190입니다. `decide.mjs` 맨 위 상수는 이 목록과 동일하며 import·파일 접근·네트워크 없이 판단합니다. 요청에 완전한 JNDI 원격 조회 구문이 있으면 confidence 0.96으로 block, T1190과 취약점 관련 단편 신호만 있으면 0.65로 alert, 나머지는 0.1로 record입니다. reason은 패턴 이름만 반환합니다. 이 확신도는 학생의 정책 수치이며 실제 악용 성공을 증명하지 않습니다.

`respond.mjs`가 차단 후보의 출발 IP에 발생 시각부터 15분 TTL과 근거 경보 번호를 붙이고 block·alert만 가린 `xdr/alerts.log`에 기록합니다. `src/xdr-decider.mjs`에서 기존 두 모듈과 함께 읽되 기존 `src/decider.mjs` 규칙은 보존했습니다. 과거·만료·미래 경보는 현재 차단 규칙에 넣지 않습니다. 운영 ALEPH SDP 엔진 계약에는 출발 IP가 없으므로 실제 운영 게이트웨이 연결은 완료됐다고 주장하지 않습니다. 연결 시험은 신뢰된 출발 IP와 경보 당시 시각으로 수행했습니다.

검증: `npm test` 60개 통과. 시험 결과 block 8 / alert 8 / record 8, 정상 이벤트 차단 0. 설치는 기존 `npm install`, 실행은 위 XDR 명령, 별도 상주 프로세스가 없어 중지는 명령 종료입니다. known-cve 규칙만 비활성화하려면 해당 deny-rules.json을 빈 배열로 보관하고 기존 모듈·DB는 보존합니다. 자료실 단계는 12, 배포 주소·발급자·허용 경로·원본 API 설정은 유지했습니다. 화면 버튼으로 실행하는 기능이 아니며 터미널에서 결과 JSON을 확인합니다.

## 보너스 xdr-04 저장점 · 몰래 심어진 프로그램 탐지

실행: `npm run xdr:run -- persistence`. 원본 24건은 보존하며 확인용 읽기 모듈도 24행을 반환합니다. 시각·출발 주소·가상 계정·수준·가린 설명만 출력합니다. `patterns.json`과 판단 파일 맨 위 상수는 동일합니다. 서비스 T1543, 예약 작업 T1053, 시작 폴더 T1547.001을 근거로 삼으며 시험 경보의 T1543 시작 폴더 표기도 수용합니다.

판단은 import·파일 접근·네트워크가 없는 독립 `decide(alert)`입니다. 수준 10 이상에서 서비스 생성·변경과 임시 실행 파일 또는 서명 없음·반복 등록이 결합되면 block, 예약 작업과 임시 실행 파일이 결합되면 block, 목록에 없는 시작 폴더 실행 파일 추가는 block입니다. 불충분한 관련 경보는 alert, 정상 경보는 record입니다. 수준은 단독 차단 근거가 아니고 임계값·확신도는 학생 정책 수치입니다. 평소 목록 자체가 경보에 없으면 목록을 임의로 만들어 채우지 않습니다.

`respond.mjs`가 차단 후보에 근거 경보 번호·발생 시각·15분 만료를 붙입니다. block·alert만 가린 alerts.log에 추가하고 과거·만료·미래 경보는 현재 차단 목록에서 제외합니다. 기존 세 XDR 모듈 및 기본 판정기 규칙은 보존합니다. 연결 시험은 신뢰된 출발 IP와 경보 당시 시각으로 정상 요청 허용·공격 거부·만료 후 해제를 확인합니다. IP는 PC 자체의 인증된 식별자가 아니며 운영 ALEPH SDP 엔진의 출발 IP/기기 매핑 연결은 미완료입니다. 운영 격리 성공으로 보고하지 않습니다.

검증: `npm test` 전체 64개 통과, 제공 경보 block 8 / alert 8 / record 8, 정상 이벤트 차단 0. 설치는 `npm install`, 실행은 위 명령, 중지는 명령 종료입니다. 복구 시 persistence deny-rules.json만 빈 배열로 보관해 해당 추가 차단을 해제하며 다른 모듈·DB를 보존합니다. 화면 버튼은 없으며 CLI의 result.json을 확인합니다. 자료실 단계 12 및 배포·발급자·원본 API·허용 경로 설정은 유지했습니다.

## 보너스 xdr-05 저장점 · 권한 가로채기 탐지

실행: `npm run xdr:run -- privilege`. 원본 26건을 보존하고 확인용 읽기 모듈은 26행의 시각·출발 주소·가상 계정·수준·가린 설명만 반환합니다. `patterns.json`을 판단 파일 맨 위 상수에 동일하게 적었습니다. 근거는 MITRE T1068 https://attack.mitre.org/techniques/T1068/ 및 T1078 https://attack.mitre.org/techniques/T1078/ 입니다. 기법 표시는 악용 성공의 증명이 아닙니다.

`decide(alert)`는 import·파일·네트워크 없이 혼자 판단합니다. 관련 기법과 수준 10 이상에서 관리자 그룹 추가에 원격 출처·명령 실행·반복 추가·빠른 재가입이 결합되거나 관리자 명령/세션 권한 변경에 신규 관리자·낯선 주소·다른 계정 권한 사용이 결합되면 block입니다. 실패·취소 및 불충분한 관련 신호는 alert, 정상은 record입니다. 시간대나 수준 하나만으로 차단하지 않으며 확신도·임계값은 학생 정책입니다. 업무 시간과 주소의 평소 목록은 임의로 채우지 않고 경보의 근거를 사용합니다.

`respond.mjs`는 판단을 재확인해 명확한 차단 후보만 계정과 PC 범위를 묶은 15분 만료 규칙으로 만들고 경보 번호를 붙입니다. block·alert만 비밀값·계정 원문·명령 원문 없는 alerts.log 한 줄로 쌓습니다. 기존 IP 거부 규칙과 기본 판정기를 보존하며 브라우저 요청의 계정값은 읽지 않습니다. 추가 계정 규칙은 신뢰된 게이트웨이의 별도 account/agentName 맵핑에서만 적용합니다. ALEPH SDP 엔진의 subjectId와 경보 계정 간 실제 매핑 및 세션 회수 API는 미연결이므로 실제 세션 회수 성공으로 보고하지 않습니다.

검증: `npm test` 69개 통과. 제공 경보 block 9 / alert 8 / record 9, 정상 이벤트 차단 0. 연결 시험에서 대상 계정·PC만 거부되고 다른 계정·다른 PC·만료 규칙은 기존 판정으로 돌아갑니다. 기존 IP 거부와 step_up도 보존됩니다. 과거 경보를 지금 재생하면 만료 규칙은 현재 목록에 넣지 않습니다. 설치는 `npm install`, 실행은 위 명령, 중지는 명령 종료. 복구는 privilege deny-rules.json만 빈 배열로 보관하여 추가 거부를 해제하며 다른 모듈·DB를 보존합니다. 화면 실행 버튼은 없고 CLI의 result.json에서 확인합니다. 자료실 단계 12와 배포·발급자·허용 경로·원본 API는 유지했습니다.

## 보너스 xdr-06 저장점 · 자료 빼돌리기 탐지

실행: `npm run xdr:run -- exfiltration`. 원본 Wazuh 형식 30건을 보존하며 확인용 읽기 모듈도 30행의 시각·출발 주소·가상 계정·수준·가린 설명을 반환합니다. 판단 파일 맨 위 패턴 상수는 patterns.json과 동일하며 import·파일 접근·네트워크 없이 decide(alert)만 내보냅니다. 근거는 MITRE T1041 https://attack.mitre.org/techniques/T1041/ 및 T1048 https://attack.mitre.org/techniques/T1048/ 입니다.

학생 정책은 관련 기법과 수준 10 이상·목적지 있음·확인된 전송 50MB 이상에 복합 신호를 요구합니다. 낯선 목적지와 100MB 이상 또는 파일 50건/전송 5회 이상이 결합되면 block, 다량 파일·반복 전송과 대용량이 결합해도 block입니다. 실패·전송 미실행·불충분한 경보는 alert, 정상은 record입니다. 음수·잘못된 숫자·미확인 전송량은 차단 근거로 사용하지 않습니다. 수치와 확신도는 학습 정책이며 실제 유출 성공 판정이 아닙니다. 업무 시간이나 평소 목적지 목록을 임의로 만들지 않습니다.

respond.mjs는 판단을 재확인해 목적지 IP와 PC 범위를 묶은 15분 만료 거부 규칙을 만들고 근거 경보 번호를 붙입니다. block·alert만 가린 alerts.log에 한 줄씩 기록합니다. 원문 파일명·자료·계정값은 알림에 넣지 않습니다. 과거·만료·미래 경보는 현재 차단 목록에 넣지 않습니다. 연결부는 신뢰된 게이트웨이가 별도 제공한 destinationIp/agentName만 읽고 브라우저 주장값은 사용하지 않습니다. ALEPH SDP 운영 요청 계약에 목적지·PC 매핑이 없으므로 실제 외부 전송 차단 연결은 미완료입니다. 기존 기본 판정기와 계정·IP 규칙을 보존합니다.

검증: npm test 74개 통과. 제공 경보 block 10 / alert 10 / record 10, 정상 이벤트 차단 0. 연결 시험에서 대상 목적지·PC만 거부되고 다른 목적지·다른 PC·만료 후 요청은 기존 판정을 유지합니다. 기존 계정·IP 거부와 step_up도 보존됩니다. 설치는 npm install, 실행은 위 명령, 중지는 명령 종료입니다. 복구는 exfiltration deny-rules.json만 빈 배열로 보관하여 추가 거부를 해제하며 다른 모듈·DB를 보존합니다. 화면 버튼은 없고 CLI result.json에서 확인합니다. 자료실 단계 12, 배포·발급자·허용 경로·원본 API 설정은 유지했습니다.
