---
trigger: glob
glob: "apps/web/**/*.{ts,tsx}"
description: Padrão obrigatório de ciclo de vida para animações Anime.js v4 e Paper Shaders no React 19+.
---

# Regra de Ciclo de Vida UI (Anime.js v4 & Paper Shaders)

1. **Anime.js v4 no React:** Nunca armazenar instâncias de animação em `useState`. Encapsular sempre em `useEffect()` utilizando `useRef()` com `createScope({ root })` e chamar obrigatoriamente `scope.current.revert()` na função de limpeza ao desmontar.
2. **Paper Shaders:** Manter a versão exata de `@paper-design/shaders-react` fixada no `package.json` (sem `^` ou `~`).
3. **Meta Astryx:** Não utilizar `@astryxdesign/charts` ou `@astryxdesign/vega` (`@canary`) em fluxos de produção.
