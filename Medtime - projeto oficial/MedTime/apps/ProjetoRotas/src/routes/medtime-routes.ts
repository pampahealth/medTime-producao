import { Router } from "express";
import { PrefeituraController } from "@/controllers/medtime/prefeitura-controller";
import { MedicoController } from "@/controllers/medtime/medico-controller";
import { MedicamentosController } from "@/controllers/medtime/medicamentos-controller";
import { PacientesController } from "@/controllers/medtime/pacientes-controller";
import { ReceitasController } from "@/controllers/medtime/receitas-controller";
import { ReceitaMedicamentosController } from "@/controllers/medtime/receita-medicamentos-controller";
import { ReceitaHorariosController } from "@/controllers/medtime/receita-horarios-controller";
import { UsuarioController } from "@/controllers/medtime/usuario-controller";
import { X001Controller } from "@/controllers/medtime/x001-controller";
import { X002Controller } from "@/controllers/medtime/x002-controller";
import { PacienteCelularesController } from "@/controllers/medtime/paciente-celulares-controller";

const medtimeRoutes = Router();

const prefeitura = new PrefeituraController();
const medico = new MedicoController();
const medicamentos = new MedicamentosController();
const pacientes = new PacientesController();
const receitas = new ReceitasController();
const receitaMedicamentos = new ReceitaMedicamentosController();
const receitaHorarios = new ReceitaHorariosController();
const usuario = new UsuarioController();
const x001 = new X001Controller();
const x002 = new X002Controller();
const pacienteCelulares = new PacienteCelularesController();

medtimeRoutes.get("/paciente-celulares", pacienteCelulares.index);
medtimeRoutes.get("/paciente-celulares/:id", pacienteCelulares.show);
medtimeRoutes.post("/paciente-celulares", pacienteCelulares.create);
medtimeRoutes.put("/paciente-celulares/:id", pacienteCelulares.update);
medtimeRoutes.delete("/paciente-celulares/:id", pacienteCelulares.delete);

medtimeRoutes.get("/prefeitura", prefeitura.index);
medtimeRoutes.get("/prefeitura/:id", prefeitura.show);
medtimeRoutes.post("/prefeitura", prefeitura.create);
medtimeRoutes.put("/prefeitura/:id", prefeitura.update);
medtimeRoutes.delete("/prefeitura/:id", prefeitura.delete);

medtimeRoutes.get("/medico", medico.index);
medtimeRoutes.get("/medico/:id", medico.show);
medtimeRoutes.post("/medico", medico.create);
medtimeRoutes.put("/medico/:id", medico.update);
medtimeRoutes.delete("/medico/:id", medico.delete);

medtimeRoutes.get("/medicamentos", medicamentos.index);
medtimeRoutes.get("/medicamentos/:id", medicamentos.show);
medtimeRoutes.post("/medicamentos", medicamentos.create);
medtimeRoutes.put("/medicamentos/:id", medicamentos.update);
medtimeRoutes.delete("/medicamentos/:id", medicamentos.delete);

medtimeRoutes.get("/pacientes", pacientes.index);
medtimeRoutes.get("/pacientes/:id", pacientes.show);
medtimeRoutes.post("/pacientes", pacientes.create);
medtimeRoutes.put("/pacientes/:id", pacientes.update);
medtimeRoutes.delete("/pacientes/:id", pacientes.delete);

medtimeRoutes.get("/receitas", receitas.index);
medtimeRoutes.get("/receitas/:id", receitas.show);
medtimeRoutes.post("/receitas", receitas.create);
medtimeRoutes.put("/receitas/:id", receitas.update);
medtimeRoutes.delete("/receitas/:id", receitas.delete);

medtimeRoutes.get("/receita-medicamentos", receitaMedicamentos.index);
medtimeRoutes.get("/receita-medicamentos/:id", receitaMedicamentos.show);
medtimeRoutes.post("/receita-medicamentos", receitaMedicamentos.create);
medtimeRoutes.put("/receita-medicamentos/:id", receitaMedicamentos.update);
medtimeRoutes.delete("/receita-medicamentos/:id", receitaMedicamentos.delete);

medtimeRoutes.get("/receita-horarios", receitaHorarios.index);
medtimeRoutes.get("/receita-horarios/:id", receitaHorarios.show);
medtimeRoutes.post("/receita-horarios", receitaHorarios.create);
medtimeRoutes.put("/receita-horarios/:id", receitaHorarios.update);
medtimeRoutes.delete("/receita-horarios/:id", receitaHorarios.delete);

medtimeRoutes.get("/usuario", usuario.index);
medtimeRoutes.get("/usuario/:id", usuario.show);
medtimeRoutes.post("/usuario", usuario.create);
medtimeRoutes.put("/usuario/:id", usuario.update);
medtimeRoutes.delete("/usuario/:id", usuario.delete);

medtimeRoutes.get("/x001", x001.index);
medtimeRoutes.get("/x001/:id", x001.show);
medtimeRoutes.post("/x001", x001.create);
medtimeRoutes.put("/x001/:id", x001.update);
medtimeRoutes.delete("/x001/:id", x001.delete);

medtimeRoutes.get("/x002", x002.index);
medtimeRoutes.get("/x002/:id", x002.show);
medtimeRoutes.post("/x002", x002.create);
medtimeRoutes.put("/x002/:id", x002.update);
medtimeRoutes.delete("/x002/:id", x002.delete);

export { medtimeRoutes };
