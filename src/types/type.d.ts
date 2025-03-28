
declare global {
    namespace NodeJS {
      interface ProcessEnv extends EnvConfig {}
    }
  }