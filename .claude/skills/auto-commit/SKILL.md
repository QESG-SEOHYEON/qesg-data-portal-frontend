# Auto Commit

git diff를 분석하여 연관 변경끼리 묶고, 커밋 컨벤션에 맞는 메시지를 생성한 뒤 자동 커밋한다.

## Actions

1. `git status`와 `git diff`(staged + unstaged)를 실행하여 변경 파일 목록과 diff 내용을 수집한다.
2. 변경사항을 **기능/목적 단위**로 그룹핑한다:
   - 같은 기능에 속하는 파일들은 하나의 커밋으로 묶는다
   - 독립적인 버그 수정, 새 기능, 리팩터링은 별도 커밋으로 분리한다
3. 각 그룹별로 커밋 메시지를 생성한다:
   - **컨벤션**: `<type>: <한글 요약>`
   - **type**: feat / fix / refactor / style / docs / chore / test
   - 요약만 커밋 메세지로 둔다. 본문은 생략한다
   - 예시 : feat: 데이터 히스토리 저장소 UI 개발
   - 1줄, 30자 내외로 간결하게, 본문(body)은 생략한다.
4. 그룹별로 `git add <files>` → `git commit` 을 순차 실행한다:
   - Co-Authored-By 줄을 항상 포함한다
   - HEREDOC 형식으로 메시지를 전달한다
5. 커밋 완료 후 `git log --oneline -N` 으로 결과를 보여준다.

## Commit Message Examples

```
feat: 랜딩 페이지 출처 현황 섹션 추가
fix: 자동완성 기업/지표 그룹 분리 버그 수정
refactor: 검색 로직 SearchWidget으로 추출
style: 코드 포맷팅
docs: README, SKILL 업데이트
chore: 빌드, 설정 변경, 패키지 의존성 업데이트
타입(wip): 기업 상세 차트 뷰 개발중
```

## Rules

- untracked 파일이 있으면 포함 여부를 판단하여 함께 add한다
- .env, credentials 등 민감 파일은 절대 커밋하지 않는다
- 변경이 1개 그룹으로 충분하면 1개 커밋만 만든다
- pre-commit hook 실패 시 문제를 수정하고 새 커밋을 생성한다 (amend 금지)
