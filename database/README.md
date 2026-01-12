# Octopus Coquinaria - Database

Este directorio contiene los scripts SQL para la base de datos Supabase de Octopus.

## 📁 Estructura

```
database/
├── MASTER_SCHEMA.sql     # ⭐ ESQUEMA PRINCIPAL (usar este)
├── RLS_POLICIES.sql      # Políticas de seguridad RLS
├── _archive/             # Scripts históricos (solo referencia)
└── *.sql                 # Scripts de migración específicos
```

## 🚀 Instalación Nueva

Para una instalación limpia en Supabase:

1. Ir al **SQL Editor** en Supabase Dashboard
2. Ejecutar `MASTER_SCHEMA.sql`
3. Ejecutar las políticas RLS según sea necesario

## ⚠️ Notas Importantes

- **NO ejecutar scripts de `_archive/`** - Son históricos de debugging
- El esquema maestro incluye tablas para:
  - Core (usuarios, businesses, projects)
  - V4 Tasks (roles, permissions, tasks, deliverables)
  - CRM (leads, academia, calendario)
  - FinanzaFlow (cuentas, transacciones, presupuestos)

## 📊 Tablas Principales

| Módulo | Tablas |
|--------|--------|
| Core | `usuarios`, `businesses`, `business_memberships`, `projects` |
| V4 | `roles`, `permissions`, `project_members`, `tasks`, `deliverables` |
| CRM | `diagnosticos_express`, `recursos_academia`, `eventos_calendario` |
| Finance | `fin_accounts`, `fin_transactions`, `fin_budget_items`, `fin_jars` |

---

*Última actualización: 2026-01-12*
