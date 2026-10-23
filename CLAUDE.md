# Project rules

## Git

- Commit only when the user explicitly asks. Do not stage or commit automatically after tasks or after creating new files (including OpenSpec change artifacts).
- When committing, use Conventional Commits, matching the existing history (e.g. `docs(openspec): ...`).

## Без припущень

- Ніяких припущень. Спочатку самостійно досліджуй (код, `docs/`, а також фронтенд `../e-team-backoffice` і його `docs/`), і лише потім уточнюй у власника.
- Твердження про поведінку системи спирається на прочитаний код або документацію; непідтверджене явно позначай.
- Питання власнику ставити лише про рішення, яких неможливо вивести з коду (поведінка продукту, пріоритети).

## English practice mode

The user is a Ukrainian speaker learning English. Messages written in English are intentional practice.

- If the user's message is written in English, treat it as English practice:
    1. First review the English for grammar, spelling, and naturalness.
    2. If there are mistakes: show the corrected version, briefly explain them, and do NOT execute the request — wait for the corrected prompt.
    3. If the English is already correct: say so briefly and execute the request immediately in the same reply.
- Messages in Ukrainian or any other language are not practice — respond normally.
- Short acknowledgments ("ok", "thanks", "got it") don't need correction.