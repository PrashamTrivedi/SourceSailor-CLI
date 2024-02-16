Analyse the given directory structure to understand the project structure and dependencies: ../jobHelper
[
  '.git',
  'logs',
  '*.log',
  'node_modules/',
  'jspm_packages/',
  '.npm',
  '.eslintcache',
  'backend/dist/',
  'backend/build/',
  'backend/out/',
  'backend/public/',
  'backend/.env',
  '.DS_Store',
  'Thumbs.db',
  'backend/*.sqlite',
  'backend/mainResume.json',
  'backend/*.db',
  'backend/uploads/*',
  'backend/database.db',
  'backend/database.db',
  '.aider*',
  'frontend/.next/',
  'frontend/out/',
  'frontend/node_modules/',
  'frontend/.next/',
  'frontend/out/',
  'frontend/.env.local',
  'frontend/.env.development.local',
  'frontend/.env.test.local',
  'frontend/.env.production.local',
  'frontend/.serverless/',
  'frontend/build/',
  'frontend/.pnp/',
  'frontend/.pnp.js',
  'frontend/coverage/',
  'frontend/.idea',
  'frontend/.vscode',
  'frontend/*.iml',
  'frontend/.DS_Store',
  'frontend/Thumbs.db',
  'backend/resumes/*',
  '*/**/tags*',
  'codeAnalysis/**/*',
  '**/*/node_modules/'
]
{
  dirs: '["../jobHelper/README.md","../jobHelper/backend/mainResume.ts","../jobHelper/backend/openai.ts","../jobHelper/backend/package.json","../jobHelper/backend/resume/resumeController.ts","../jobHelper/backend/resume/resumeModel.ts","../jobHelper/backend/resume/resumeRouter.ts","../jobHelper/backend/resume/resumeTemplate.ts","../jobHelper/backend/routes.ts","../jobHelper/backend/tsconfig.dev.json","../jobHelper/backend/tsconfig.json","../jobHelper/backend/utils/morganMiddleware.ts","../jobHelper/backend/utils/swagger.ts","../jobHelper/frontend/README.md","../jobHelper/frontend/app/create-job/page.tsx","../jobHelper/frontend/app/favicon.ico","../jobHelper/frontend/app/globals.css","../jobHelper/frontend/app/inferredData/page.tsx","../jobHelper/frontend/app/layout.tsx","../jobHelper/frontend/app/lib/actions/jobInferrence.ts","../jobHelper/frontend/app/lib/actions/jobs.ts","../jobHelper/frontend/app/lib/actions/mainResume.ts","../jobHelper/frontend/app/main-resume/page.tsx","../jobHelper/frontend/app/page.tsx","../jobHelper/frontend/app/saved-jobs/page.tsx","../jobHelper/frontend/app/saved-resumes/page.tsx","../jobHelper/frontend/app/ui/JobLoadingSkeleton.tsx","../jobHelper/frontend/app/ui/buttons.tsx","../jobHelper/frontend/app/ui/inferredData.tsx","../jobHelper/frontend/app/ui/jobsCard.tsx","../jobHelper/frontend/app/ui/jobsList.tsx","../jobHelper/frontend/app/ui/navLinks.tsx","../jobHelper/frontend/next-env.d.ts","../jobHelper/frontend/next.config.js","../jobHelper/frontend/package.json","../jobHelper/frontend/postcss.config.js","../jobHelper/frontend/public/next.svg","../jobHelper/frontend/public/vercel.svg","../jobHelper/frontend/tailwind.config.ts","../jobHelper/frontend/tsconfig.json","../jobHelper/jobjigsaw-frontend/README.md","../jobHelper/jobjigsaw-frontend/dist/assets/index-3eEiIOwL.css","../jobHelper/jobjigsaw-frontend/dist/assets/index-y6ajtgE-.js","../jobHelper/jobjigsaw-frontend/dist/index.html","../jobHelper/jobjigsaw-frontend/dist/vite.svg","../jobHelper/jobjigsaw-frontend/index.css","../jobHelper/jobjigsaw-frontend/index.html","../jobHelper/jobjigsaw-frontend/package-lock.json","../jobHelper/jobjigsaw-frontend/package.json","../jobHelper/jobjigsaw-frontend/postcss.config.js","../jobHelper/jobjigsaw-frontend/public/vite.svg","../jobHelper/jobjigsaw-frontend/src/App.css","../jobHelper/jobjigsaw-frontend/src/App.tsx","../jobHelper/jobjigsaw-frontend/src/JobLoadingSkeleton.tsx","../jobHelper/jobjigsaw-frontend/src/assets/react.svg","../jobHelper/jobjigsaw-frontend/src/buttons.tsx","../jobHelper/jobjigsaw-frontend/src/createJob.css","../jobHelper/jobjigsaw-frontend/src/createJob.tsx","../jobHelper/jobjigsaw-frontend/src/data/jobInferrence.ts","../jobHelper/jobjigsaw-frontend/src/data/jobs.ts","../jobHelper/jobjigsaw-frontend/src/data/mainResume.ts","../jobHelper/jobjigsaw-frontend/src/data/resumes.ts","../jobHelper/jobjigsaw-frontend/src/env.d.ts","../jobHelper/jobjigsaw-frontend/src/errorPage.tsx","../jobHelper/jobjigsaw-frontend/src/index.css","../jobHelper/jobjigsaw-frontend/src/inferredData.tsx","../jobHelper/jobjigsaw-frontend/src/inferredJob.tsx","../jobHelper/jobjigsaw-frontend/src/jobsCard.tsx","../jobHelper/jobjigsaw-frontend/src/jobsList.tsx","../jobHelper/jobjigsaw-frontend/src/main.tsx","../jobHelper/jobjigsaw-frontend/src/mainContent.tsx","../jobHelper/jobjigsaw-frontend/src/mainResume.tsx","../jobHelper/jobjigsaw-frontend/src/navLinks.tsx","../jobHelper/jobjigsaw-frontend/src/printResume.tsx","../jobHelper/jobjigsaw-frontend/src/resume.tsx","../jobHelper/jobjigsaw-frontend/src/resumeCard.tsx","../jobHelper/jobjigsaw-frontend/src/resumeSkeleton.tsx","../jobHelper/jobjigsaw-frontend/src/resumes.tsx","../jobHelper/jobjigsaw-frontend/src/resumesList.tsx","../jobHelper/jobjigsaw-frontend/src/savedJobs.tsx","../jobHelper/jobjigsaw-frontend/src/savedResumes.tsx","../jobHelper/jobjigsaw-frontend/src/vite-env.d.ts","../jobHelper/jobjigsaw-frontend/tailwind.config.js","../jobHelper/jobjigsaw-frontend/tsconfig.json","../jobHelper/jobjigsaw-frontend/tsconfig.node.json","../jobHelper/jobjigsaw-frontend/vite.config.ts","../jobHelper/renovate.json","../jobHelper/tags"]'
}
{
  config: {
    OPENAI_API_KEY: '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',
    DEFAULT_OPENAI_MODEL: 'gpt-4-turbo-preview'
  }
}
{ key: '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' }
System Prompt: Based on the given file structure in JSON surrounded by <FileStructure> tag, 
        Please answer following questions
        1. Is the repository a single codebase or a monorepo?
        2. If it is a monorepo, what are the different codebases in the monorepo?
        3. If it is a single codebase, what is the programming language and framework used to build this application?
        4. If it is a single codebase, give me the filename where dependencies are defined and entry points of the applications.
        5. If it is a single code
        Please guess the programming language and framework used to build this application. 
        If you think this project is a monorepo consisting multiple codebase, you will guess the role of each directories in the codebase.
        If this is not the monorepo, you will tell me which files to look to understand dependencies of given codebase. You will tell me which file or files to read to get started.
User Prompt: ["../jobHelper/README.md","../jobHelper/backend/mainResume.ts","../jobHelper/backend/openai.ts","../jobHelper/backend/package.json","../jobHelper/backend/resume/resumeController.ts","../jobHelper/backend/resume/resumeModel.ts","../jobHelper/backend/resume/resumeRouter.ts","../jobHelper/backend/resume/resumeTemplate.ts","../jobHelper/backend/routes.ts","../jobHelper/backend/tsconfig.dev.json","../jobHelper/backend/tsconfig.json","../jobHelper/backend/utils/morganMiddleware.ts","../jobHelper/backend/utils/swagger.ts","../jobHelper/frontend/README.md","../jobHelper/frontend/app/create-job/page.tsx","../jobHelper/frontend/app/favicon.ico","../jobHelper/frontend/app/globals.css","../jobHelper/frontend/app/inferredData/page.tsx","../jobHelper/frontend/app/layout.tsx","../jobHelper/frontend/app/lib/actions/jobInferrence.ts","../jobHelper/frontend/app/lib/actions/jobs.ts","../jobHelper/frontend/app/lib/actions/mainResume.ts","../jobHelper/frontend/app/main-resume/page.tsx","../jobHelper/frontend/app/page.tsx","../jobHelper/frontend/app/saved-jobs/page.tsx","../jobHelper/frontend/app/saved-resumes/page.tsx","../jobHelper/frontend/app/ui/JobLoadingSkeleton.tsx","../jobHelper/frontend/app/ui/buttons.tsx","../jobHelper/frontend/app/ui/inferredData.tsx","../jobHelper/frontend/app/ui/jobsCard.tsx","../jobHelper/frontend/app/ui/jobsList.tsx","../jobHelper/frontend/app/ui/navLinks.tsx","../jobHelper/frontend/next-env.d.ts","../jobHelper/frontend/next.config.js","../jobHelper/frontend/package.json","../jobHelper/frontend/postcss.config.js","../jobHelper/frontend/public/next.svg","../jobHelper/frontend/public/vercel.svg","../jobHelper/frontend/tailwind.config.ts","../jobHelper/frontend/tsconfig.json","../jobHelper/jobjigsaw-frontend/README.md","../jobHelper/jobjigsaw-frontend/dist/assets/index-3eEiIOwL.css","../jobHelper/jobjigsaw-frontend/dist/assets/index-y6ajtgE-.js","../jobHelper/jobjigsaw-frontend/dist/index.html","../jobHelper/jobjigsaw-frontend/dist/vite.svg","../jobHelper/jobjigsaw-frontend/index.css","../jobHelper/jobjigsaw-frontend/index.html","../jobHelper/jobjigsaw-frontend/package-lock.json","../jobHelper/jobjigsaw-frontend/package.json","../jobHelper/jobjigsaw-frontend/postcss.config.js","../jobHelper/jobjigsaw-frontend/public/vite.svg","../jobHelper/jobjigsaw-frontend/src/App.css","../jobHelper/jobjigsaw-frontend/src/App.tsx","../jobHelper/jobjigsaw-frontend/src/JobLoadingSkeleton.tsx","../jobHelper/jobjigsaw-frontend/src/assets/react.svg","../jobHelper/jobjigsaw-frontend/src/buttons.tsx","../jobHelper/jobjigsaw-frontend/src/createJob.css","../jobHelper/jobjigsaw-frontend/src/createJob.tsx","../jobHelper/jobjigsaw-frontend/src/data/jobInferrence.ts","../jobHelper/jobjigsaw-frontend/src/data/jobs.ts","../jobHelper/jobjigsaw-frontend/src/data/mainResume.ts","../jobHelper/jobjigsaw-frontend/src/data/resumes.ts","../jobHelper/jobjigsaw-frontend/src/env.d.ts","../jobHelper/jobjigsaw-frontend/src/errorPage.tsx","../jobHelper/jobjigsaw-frontend/src/index.css","../jobHelper/jobjigsaw-frontend/src/inferredData.tsx","../jobHelper/jobjigsaw-frontend/src/inferredJob.tsx","../jobHelper/jobjigsaw-frontend/src/jobsCard.tsx","../jobHelper/jobjigsaw-frontend/src/jobsList.tsx","../jobHelper/jobjigsaw-frontend/src/main.tsx","../jobHelper/jobjigsaw-frontend/src/mainContent.tsx","../jobHelper/jobjigsaw-frontend/src/mainResume.tsx","../jobHelper/jobjigsaw-frontend/src/navLinks.tsx","../jobHelper/jobjigsaw-frontend/src/printResume.tsx","../jobHelper/jobjigsaw-frontend/src/resume.tsx","../jobHelper/jobjigsaw-frontend/src/resumeCard.tsx","../jobHelper/jobjigsaw-frontend/src/resumeSkeleton.tsx","../jobHelper/jobjigsaw-frontend/src/resumes.tsx","../jobHelper/jobjigsaw-frontend/src/resumesList.tsx","../jobHelper/jobjigsaw-frontend/src/savedJobs.tsx","../jobHelper/jobjigsaw-frontend/src/savedResumes.tsx","../jobHelper/jobjigsaw-frontend/src/vite-env.d.ts","../jobHelper/jobjigsaw-frontend/tailwind.config.js","../jobHelper/jobjigsaw-frontend/tsconfig.json","../jobHelper/jobjigsaw-frontend/tsconfig.node.json","../jobHelper/jobjigsaw-frontend/vite.config.ts","../jobHelper/renovate.json","../jobHelper/tags"]
Model limit: 8000, Tokens: 1269
1. The given file structure represents a monorepo.
2. The different codebases in the monorepo are:
   - jobHelper/backend
   - jobHelper/frontend
   - jobHelper/jobjigsaw-frontend
3. N/A (Since it is a monorepo)
4. N/A (Since it is a monorepo)
5. The programming language and framework used to build this monorepo cannot be determined from the given file structure.
