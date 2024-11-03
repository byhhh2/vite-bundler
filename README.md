## Day2

- vite config에서 build.target은 누구의 target인가?
  - 요건 esbuild의 target이다.
  - [프로덕션 빌드 > 변환은 esbuild에 의해 수행된다.](https://ko.vite.dev/config/build-options.html#build-target)
    - target은 언어 버전이나 브라우저 버전이 올 수 있음 <https://esbuild.github.io/api/#target>
    - esbuild는 `.browserslistrc`를 읽지 않아서 `browserslistToEsbuild` 라이브러리가 필요하다.
  - 프로덕션 빌드에서 esbuild를 안쓴다는 건 번들링에서 안쓴다고..🙄 번들링은 rollup이 (잘못이해함;) <https://ko.vite.dev/guide/why.html#why-not-bundle-with-esbuild>
- 지금 rollup babel plugin에 `@babel/preset-env`가 지정되어 있는데 이러면 트랜스파일도, 폴리필도 babel + corejs가 한다.
  - 증거: `getBabelOutputPlugin` + `@babel/preset-env` + `target: undefined (=.browserslistrc)`로 빌드하면 chrome >= 79에 맞춰서 `??=`가 `(o = n[t]) !== null && o !== void 0 || (n[t] = r[t]);`로 바뀌어서 빌드가 됨 (왜냠 babel이 browserslist를 읽어서 트랜스 파일도 했으니깐)
    - `getBabelOutputPlugin` 부분을 아예 지워버리면 `??=`가 `??`로 트랜스파일 됨 (esbuild가 browserslistrc를 못 읽어서) = 바벨이 트랜스파일 했군.
  - 폴리필은 babel + corejs 조합으로 하고 트랜스파일은 빠른 esbuild가 했으면 함
    - 그래서 `@babel/preset-env`을 못 쓸듯? 🙄
  - 설정 후에 트랜스파일을 esbuild가 하는지 확인 필요

![image](https://github.com/user-attachments/assets/f051ee8d-b49e-4337-9dc3-75fac099b008)

- `@rollup/plugin-babel`의 `babelHelpers`
  - 바벨 헬퍼를 코드에 삽입하는 방법
  - 바벨 헬퍼란?...
  - `runtime`
    - 라이브러리를 만들 때 권장
    - `@babel/plugin-transform-runtime` 사용 필요, `@babel/runtime` dep에 설치 필요
    - 왜 `@babel/runtime`를 dep에 설치하냐 요게 핵심인데, 내 라이브러리 번들에 `@babel/runtime`을 포함 안시키고 내 라이브러리 사용처에서 `@babel/runtime`이 설치되게 만들어서 난 import만 하겠다는 뜻
    - 그래서 rollup 설정에 external 옵션을 지정해줘야 함
- `@rollup/plugin-babel`의 `getBabelOutputPlugin`
  - 얘는 애초에 번들 이후에 폴리필 처리를 하는건데.. runtime이 bundled 일수가 있..나?
  - 아무튼 `getBabelOutputPlugin`로 runtime 설정하는 법 <https://github.com/rollup/plugins/tree/master/packages/babel#injected-helpers> (babelHelpers runtime과 동일하게 `@babel/plugin-transform-runtime` 사용)
  - 왜 지금 코드는 그냥 import로 처리됐나? `@babel/preset-env` 설정을 `useBuiltIns: 'usage'`로 했기 때문 <https://babeljs.io/docs/babel-preset-env#usebuiltins>
    - When either the usage or entry options are used, @babel/preset-env will add direct references to core-js modules as bare imports (or requires).

> 결론? 트랜스파일 (esbuild) + 폴리필 (babel + corejs) + 번들링 (rollup)

## Day 3

### TODO

- 샘플 번들러 만들기
- 기본값으로 cjs, esm 지원 (사용자가 선택 가능)
- input은 객체로 받기
- 사용처 entry는 src 폴더 내부 경로로 하기 (이외는 에러 throw)
- vite 커스텀 옵션 받기
- 폴리필이 필요한 코드가 작성되어 있다면 에러 throw

## 설정

- browserslist-to-esbuild
  - browserslistrc를 잘 읽는다.
- build를 잘 하고 있는지
  - resolved 된 config를 확인한다. (`resolveConfig` 이거 씀)
- vite 등의 라이브러리들은 dep에 설치되어야 할까, devDep에 설치되어야 할까? (dep..🙄 깔려야하므로)
- node_modules를 빌드에서 제거
  - 라이브러리를 dep로 설치할거면 빌드 결과물에는 필요 없을듯
  - 전에는 딱히 설정한 적이 없었는데 라이브러리에서 nodejs api를 써서 그런지 폴리필 없다고 error남
- vite.config.ts에서 vite api를 import 하면 cjs에서 import 못한다고 함
  - 아마..package.json에 type module이 설정안돼서?
  - mts로 바꿔버림
  - https://vite.dev/guide/troubleshooting.html#vite-cjs-node-api-deprecated
- `.browserslistrc`를 읽어서 폴리필이 필요한 코드가 포함되어 있는지 확인할 수 있는 방법
  - core-js-compat 쓰려고 했는데; 코드를 못 읽는..ㅜ
  - (1) 파일 정적 분석 (2) 폴리필 추가하고 추가됐는지 확인 (이렇게 밖에 생각이 안남..)
  - (2)로 함 (`@rollup/plugin-babel` + `@babel/plugin-transform-runtime`로 corejs import 추가하고 import 했는지 검사함. corejs는..설치 안하는 것으로)
- vite config override 하기
  - mergeConfig를 썼는데.. 졸려서 테스트 못함

## 해야함

- 라이브러리 모드만 지원됨
- entry 배열로 못 받음
- 배포
- dts 추가
- cosmiconfig로 browserslistrc 존재 여부 확인
