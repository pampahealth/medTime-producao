"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.V2Controller = void 0;
class V2Controller {
    service;
    constructor(service) {
        this.service = service;
    }
    async resumo(req, res) {
        const data = await this.service.resumoOperacional();
        res.status(200).json(data);
    }
}
exports.V2Controller = V2Controller;
