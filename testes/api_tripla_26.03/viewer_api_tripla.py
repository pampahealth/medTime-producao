#!/usr/bin/env python3
from __future__ import annotations

import json
import tkinter as tk
from tkinter import ttk, messagebox

import requests


class ViewerApiTripla:
    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.root.title("API Tripla - Visualizador JSON")
        self.root.geometry("1080x740")

        self.base_url = tk.StringVar(value="http://localhost:3010")
        self.search_type = tk.StringVar(value="data")
        self.search_value = tk.StringVar()
        self.search_value_end = tk.StringVar()
        self.session = requests.Session()

        self._build()

    def _build(self) -> None:
        pad = {"padx": 8, "pady": 6}

        top = ttk.LabelFrame(self.root, text="Configuracao")
        top.pack(fill="x", padx=10, pady=8)

        ttk.Label(top, text="Base URL").grid(row=0, column=0, sticky="w", **pad)
        ttk.Entry(top, textvariable=self.base_url, width=45).grid(row=0, column=1, sticky="w", **pad)
        ttk.Button(top, text="Testar Health", command=self.test_health).grid(row=0, column=2, sticky="w", **pad)

        search = ttk.LabelFrame(self.root, text="Busca de Receitas")
        search.pack(fill="x", padx=10, pady=8)

        ttk.Label(search, text="Tipo de busca").grid(row=0, column=0, sticky="w", **pad)
        combo = ttk.Combobox(
            search,
            textvariable=self.search_type,
            values=("data", "nome_paciente", "cartao_sus"),
            state="readonly",
            width=20
        )
        combo.grid(row=0, column=1, sticky="w", **pad)
        combo.bind("<<ComboboxSelected>>", self._refresh_hint)

        self.hint_label = ttk.Label(search, text="Data inicial")
        self.hint_label.grid(row=1, column=0, sticky="w", **pad)
        ttk.Entry(search, textvariable=self.search_value, width=60).grid(row=1, column=1, columnspan=2, sticky="we", **pad)

        self.hint_label_end = ttk.Label(search, text="Data final (opcional)")
        self.hint_label_end.grid(row=2, column=0, sticky="w", **pad)
        self.end_entry = ttk.Entry(search, textvariable=self.search_value_end, width=60)
        self.end_entry.grid(row=2, column=1, columnspan=2, sticky="we", **pad)

        ttk.Button(search, text="Buscar e mostrar JSON", command=self.search).grid(row=3, column=0, sticky="w", **pad)

        out = ttk.LabelFrame(self.root, text="Saida JSON")
        out.pack(fill="both", expand=True, padx=10, pady=8)

        self.status = ttk.Label(out, text="Status: aguardando...")
        self.status.pack(anchor="w", padx=8, pady=4)

        output_frame = ttk.Frame(out)
        output_frame.pack(fill="both", expand=True, padx=8, pady=6)

        self.output = tk.Text(output_frame, wrap=tk.NONE, font=("Consolas", 10))
        self.output.grid(row=0, column=0, sticky="nsew")

        scrollbar_y = ttk.Scrollbar(output_frame, orient="vertical", command=self.output.yview)
        scrollbar_y.grid(row=0, column=1, sticky="ns")

        scrollbar_x = ttk.Scrollbar(output_frame, orient="horizontal", command=self.output.xview)
        scrollbar_x.grid(row=1, column=0, sticky="ew")

        self.output.configure(yscrollcommand=scrollbar_y.set)
        self.output.configure(xscrollcommand=scrollbar_x.set)

        output_frame.columnconfigure(0, weight=1)
        output_frame.rowconfigure(0, weight=1)

    def _refresh_hint(self, _event: object | None = None) -> None:
        mode = self.search_type.get()
        if mode == "data":
            self.hint_label.configure(text="Data inicial")
            self.hint_label_end.configure(text="Data final (opcional)")
            self.end_entry.configure(state="normal")
        elif mode == "nome_paciente":
            self.hint_label.configure(text="Valor (nome parcial do paciente)")
            self.hint_label_end.configure(text="Nao usado neste tipo")
            self.search_value_end.set("")
            self.end_entry.configure(state="disabled")
        else:
            self.hint_label.configure(text="Valor (numero do cartao SUS)")
            self.hint_label_end.configure(text="Nao usado neste tipo")
            self.search_value_end.set("")
            self.end_entry.configure(state="disabled")

    def _show(self, title: str, status_code: int, payload: object) -> None:
        pretty = json.dumps(payload, ensure_ascii=False, indent=2)
        self.output.delete("1.0", tk.END)
        self.output.insert(tk.END, f"{title}\nHTTP {status_code}\n\n{pretty}\n")
        self.status.configure(text=f"Status: {title} -> HTTP {status_code}")

    def test_health(self) -> None:
        try:
            response = self.session.get(f"{self.base_url.get().rstrip('/')}/health", timeout=20)
            payload = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
            self._show("GET /health", response.status_code, payload)
        except Exception as exc:
            messagebox.showerror("Erro", f"Falha no /health: {exc}")

    def search(self) -> None:
        value = self.search_value.get().strip()
        if not value:
            messagebox.showwarning("Aviso", "Informe o valor de busca.")
            return

        mode = self.search_type.get()
        base = self.base_url.get().rstrip("/")
        if mode == "data":
            url = f"{base}/api/receitas/por-data"
            params = {"data_receita_inicio": value}
            end_value = self.search_value_end.get().strip()
            if end_value:
                params["data_receita_fim"] = end_value
            title = "GET /api/receitas/por-data"
        elif mode == "nome_paciente":
            url = f"{base}/api/receitas/por-paciente"
            params = {"nome_paciente": value}
            title = "GET /api/receitas/por-paciente"
        else:
            url = f"{base}/api/receitas/por-cartao-sus"
            params = {"cartao_sus": value}
            title = "GET /api/receitas/por-cartao-sus"

        try:
            response = self.session.get(url, params=params, timeout=45)
            payload = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"raw": response.text}
            self._show(title, response.status_code, payload)
        except Exception as exc:
            messagebox.showerror("Erro", f"Falha na busca: {exc}")


def main() -> None:
    root = tk.Tk()
    ViewerApiTripla(root)
    root.mainloop()


if __name__ == "__main__":
    main()
