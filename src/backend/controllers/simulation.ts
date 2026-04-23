import { simulationService } from '../services/simulation';

export async function runSimulation(data: any) {
    try {
        const result = await simulationService.run(data);

        return Response.json(result);
    } catch (error: any) {
        return Response.json(
            { error: error.message || 'Simulation failed' },
            { status: 500 }
        );
    }
}