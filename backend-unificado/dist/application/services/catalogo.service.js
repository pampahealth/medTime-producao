"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogoService = void 0;
class CatalogoService {
    pacientesRepo;
    medicamentosRepo;
    horariosRepo;
    constructor(pacientesRepo, medicamentosRepo, horariosRepo) {
        this.pacientesRepo = pacientesRepo;
        this.medicamentosRepo = medicamentosRepo;
        this.horariosRepo = horariosRepo;
    }
    async resumoOperacional() {
        const [pacientes, medicamentos, horarios] = await Promise.all([
            this.pacientesRepo.listarAtivos(500),
            this.medicamentosRepo.listarAtivos(500),
            this.horariosRepo.listarProximos(1000),
        ]);
        return {
            total_pacientes: pacientes.length,
            total_medicamentos: medicamentos.length,
            total_horarios_proximos: horarios.length,
            pacientes,
            medicamentos,
            horarios,
        };
    }
}
exports.CatalogoService = CatalogoService;
