import { scryptAsync } from '@noble/hashes/scrypt.js';
import { Buffer } from 'node:buffer';
Deno.test('Edge scrypt matches existing Node.js password hashes', async () => {
  const key=Buffer.from(await scryptAsync('senha-segura-123','0123456789abcdef0123456789abcdef',{N:16384,r:8,p:1,dkLen:64})).toString('hex');
  const expected='b167fd8a6152b100774ec3a3ec70774083de8dbf5b27e6739ac358d6746a28cd3923d95a2cff5a7b1b70d44ef202db92a4075e944187ec7d5651e78d1c54a545';
  if(key!==expected) throw new Error('Legacy password mismatch');
});

import { authService } from '../_shared/backend/domains/auth/service.js';
Deno.test('Edge login accepts an existing account using the shared auth service', async () => {
  const db = {
    dialect: 'postgres',
    transaction: (callback: (...args: unknown[]) => unknown) => callback,
    query: async () => ({ rows: [{id:1,name:'Teste',email:'test@example.test',password_hash:'0123456789abcdef0123456789abcdef:b167fd8a6152b100774ec3a3ec70774083de8dbf5b27e6739ac358d6746a28cd3923d95a2cff5a7b1b70d44ef202db92a4075e944187ec7d5651e78d1c54a545'}] }),
    deriveKey: async (password: string,salt: string,length: number) => Buffer.from(await scryptAsync(password,salt,{N:16384,r:8,p:1,dkLen:length})),
  };
  const user=await authService(db).login({email:'test@example.test',password:'senha-segura-123'});
  if(user.id!==1) throw new Error('Login failed');
});
