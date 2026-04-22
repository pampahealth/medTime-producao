"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedtimeController = void 0;
class MedtimeController {
    service;
    constructor(service) {
        this.service = service;
    }
    async list(req, res) {
        const resource = String(req.params.resource ?? "");
        const query = Object.fromEntries(Object.entries(req.query).map(([k, v]) => [k, Array.isArray(v) ? v.map(String) : v != null ? String(v) : undefined]));
        const data = await this.service.list(resource, query);
        res.status(200).json(data);
    }
    async getById(req, res) {
        const resource = String(req.params.resource ?? "");
        const id = String(req.params.id ?? "");
        const data = await this.service.getById(resource, id);
        if (!data) {
            res.status(404).json({ error: "Registro nao encontrado" });
            return;
        }
        res.status(200).json(data);
    }
    async create(req, res) {
        const resource = String(req.params.resource ?? "");
        const created = await this.service.create(resource, req.body ?? {});
        res.status(201).json(created);
    }
    async update(req, res) {
        const resource = String(req.params.resource ?? "");
        const id = String(req.params.id ?? "");
        const updated = await this.service.update(resource, id, req.body ?? {});
        if (!updated) {
            res.status(404).json({ error: "Registro nao encontrado" });
            return;
        }
        res.status(200).json(updated);
    }
    async remove(req, res) {
        const resource = String(req.params.resource ?? "");
        const id = String(req.params.id ?? "");
        await this.service.remove(resource, id);
        res.status(204).send();
    }
}
exports.MedtimeController = MedtimeController;
