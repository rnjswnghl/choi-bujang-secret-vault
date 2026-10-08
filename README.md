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
