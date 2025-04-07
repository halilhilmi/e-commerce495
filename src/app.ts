import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import routes from "./routes";
import cookieParser from "cookie-parser";

class App {
  public server: Express;

  constructor() {
    this.server = express();
    
    this.server.use(cors({
      origin: '*',
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Authorization",
        "Content-Type",
        "X-Requested-With",
        "Accept",
        "Origin",
        "Access-Control-Allow-Headers",
        "Access-Control-Allow-Origin",
        "Access-Control-Allow-Credentials",
        "ads-access-token",
        "ads-refresh-token"
      ]
    }));
    
    this.server.options('*', cors());
    
    this.middlewares();
    this.routes();
  }

  middlewares() {
    this.server.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
      console.log('Headers:', JSON.stringify(req.headers));
      next();
    });
    
    this.server.use(express.json({ limit: "50mb" }));
    this.server.use(express.urlencoded({ limit: "50mb", extended: true }));
    this.server.use(cookieParser());
    
    // Log all incoming requests
    this.server.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
      next();
    });
  }

  routes() {
    this.server.use('/api', routes);
  }
}

export default new App().server;
