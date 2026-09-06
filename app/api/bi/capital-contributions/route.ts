import {
  BusinessIntelligenceService,
  readJsonObject,
} from "@/src/modules/business-intelligence/application/business-intelligence.service";
import { businessIntelligenceErrorResponse } from "@/src/modules/business-intelligence/presentation/http/error-response";

const service = new BusinessIntelligenceService();

export async function GET(): Promise<Response> {
  try {
    return Response.json({ data: await service.listCapitalContributions() });
  } catch (error) {
    return businessIntelligenceErrorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    return Response.json({ data: await service.createCapitalContribution(await readJsonObject(request)) }, { status: 201 });
  } catch (error) {
    return businessIntelligenceErrorResponse(error);
  }
}
