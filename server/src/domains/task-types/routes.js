import { Router } from 'express';
import { taskTypeService } from './service.js';
import { asyncRoute } from '../../shared/http.js';
export function taskTypeRoutes(db) {
  const router=Router();
  const service=taskTypeService(db);
  router.get('/',asyncRoute(async(req,res)=>res.json(await service.list(req.user.id))));
  router.post('/',asyncRoute(async(req,res)=>res.status(201).json(await service.create(req.body || {},req.user.id))));
  router.patch('/:id',asyncRoute(async(req,res)=>{
    const id=Number(req.params.id);
    if(!Number.isSafeInteger(id)||id<1||id>2147483647)return res.status(404).json({error:'Tipo não encontrado.'});
    res.json(await service.update(id,req.body || {},req.user.id));
  }));
  return router;
}
