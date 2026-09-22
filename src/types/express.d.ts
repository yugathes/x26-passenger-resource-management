import { CrewLead } from '@prisma/client';

// Augments Express's Request with the crew lead attached by requireCrewLead middleware
declare global {
  namespace Express {
    interface Request {
      crewLead?: CrewLead;
    }
  }
}

export {};
