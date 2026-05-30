import { env } from '@/config/env';
import app from './app';

app.listen(env.PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${env.PORT}`);
    console.log(`📚 Documentação em http://localhost:${env.PORT}/api/docs`);
});
