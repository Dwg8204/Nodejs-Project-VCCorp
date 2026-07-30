import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface MemoryEntry { value:string; expiresAt:number; }

@Injectable()
export class AppCacheService implements OnModuleDestroy {
  private readonly logger=new Logger(AppCacheService.name);
  private readonly memory=new Map<string,MemoryEntry>();
  private readonly redis:Redis|null;
  private redisUsable=false;
  private readonly prefix:string;

  constructor(config:ConfigService) {
    this.prefix=config.get<string>('REDIS_KEY_PREFIX','vccorp:');
    if (!config.get<boolean>('REDIS_ENABLED', false)) {
      this.redis = null;
      return;
    }
    this.redis=new Redis({
      host:config.get<string>('REDIS_HOST','127.0.0.1'),
      port:Number(config.get<string>('REDIS_PORT','6379')),
      password:config.get<string>('REDIS_PASSWORD')||undefined,
      db:Number(config.get<string>('REDIS_DB','0')),
      lazyConnect:true,maxRetriesPerRequest:1,enableOfflineQueue:false,
    });
    this.redis.on('ready',()=>{this.redisUsable=true;this.logger.log('Redis cache connected');});
    this.redis.on('close',()=>{this.redisUsable=false;});
    this.redis.on('error',(error)=>{this.redisUsable=false;this.logger.warn(`Redis unavailable; using memory cache: ${error.message}`);});
    void this.redis.connect().catch(()=>undefined);
  }

  async getOrSet<T>(key:string,ttlSeconds:number,loader:()=>Promise<T>):Promise<T> {
    const cached=await this.get<T>(key);
    if(cached!==undefined)return cached;
    const value=await loader();
    await this.set(key,value,ttlSeconds);
    return value;
  }

  async invalidatePrefix(prefix:string):Promise<void> {
    const namespaced=this.key(prefix);
    for(const key of this.memory.keys())if(key.startsWith(namespaced))this.memory.delete(key);
    if(!this.redis||!this.redisUsable)return;
    let cursor='0';
    do{
      const [next,keys]=await this.redis.scan(cursor,'MATCH',`${namespaced}*`,'COUNT',100);
      cursor=next;
      if(keys.length)await this.redis.del(...keys);
    }while(cursor!=='0');
  }

  async onModuleDestroy():Promise<void>{if(this.redis)this.redis.disconnect();}

  private async get<T>(key:string):Promise<T|undefined> {
    const namespaced=this.key(key);
    if(this.redis&&this.redisUsable){
      try{const value=await this.redis.get(namespaced);if(value!==null)return JSON.parse(value) as T;}catch{this.redisUsable=false;}
    }
    const cached=this.memory.get(namespaced);
    if(!cached)return undefined;
    if(cached.expiresAt<=Date.now()){this.memory.delete(namespaced);return undefined;}
    if (this.redis && this.redisUsable) {
      const remainingSeconds = Math.max(1, Math.ceil((cached.expiresAt - Date.now()) / 1000));
      try {
        await this.redis.set(namespaced, cached.value, 'EX', remainingSeconds);
      } catch {
        this.redisUsable = false;
      }
    }
    return JSON.parse(cached.value) as T;
  }

  private async set(key:string,value:unknown,ttlSeconds:number):Promise<void> {
    const namespaced=this.key(key),serialized=JSON.stringify(value);
    this.memory.set(namespaced,{value:serialized,expiresAt:Date.now()+ttlSeconds*1000});
    if(this.redis&&this.redisUsable){
      try{await this.redis.set(namespaced,serialized,'EX',ttlSeconds);}catch{this.redisUsable=false;}
    }
  }
  private key(value:string):string{return `${this.prefix}${value}`;}
}
