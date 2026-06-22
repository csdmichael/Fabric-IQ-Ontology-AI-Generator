export interface OntologySamplePrompt {
  title: string;
  text: string;
}

export const ONTOLOGY_SAMPLE_PROMPTS: OntologySamplePrompt[] = [
  {
    title: 'Semiconductor Material Shortage Intelligence',
    text: 'Manage semiconductor parts shortages by connecting supply chain, inventory, procurement, planning, manufacturing, quality, and engineering data around a central MaterialPlant entity (a specific material at a specific manufacturing plant). It captures how materials are sourced from suppliers, procured through purchase orders, planned through MRP processes, stocked in inventory, consumed by manufacturing configurations, and ultimately support customer demand. By linking these business entities together, the ontology creates a unified view of the factors that influence material availability and production continuity.\n\nThe ontology also incorporates operational events such as Shortage Events, Non-Conformance Records, and Problem Reports to provide contextual reasoning and root-cause analysis. Derived properties calculated by the ontology, such as shortage severity, supplier risk, inventory coverage days, late purchase orders, and recommended mitigation paths, enable AI agents and business users to proactively identify risks, understand downstream impacts on production and customer orders, and take corrective actions. This transforms disconnected ERP, supply chain, quality, and manufacturing data into an intelligent decision-support system capable of answering questions such as which products, customers, or production lines are at risk from a material shortage and what actions should be taken to mitigate the impact.'
  },
  {
    title: 'Factory Quality Traceability',
    text: 'Build an ontology for end-to-end manufacturing quality traceability. Model Product, WorkOrder, ProductionLine, Machine, Batch, Operator, InspectionResult, NonConformance, CorrectiveAction, and SupplierLot entities. Capture relationships from incoming material lots through production operations, in-process inspections, final test outcomes, and shipped customer units. Include rules to infer escaped defects, recurring failure patterns by machine and shift, and high-risk supplier lots to support faster root-cause investigations and preventive quality actions.'
  },
  {
    title: 'Predictive Maintenance and Uptime',
    text: 'Create a manufacturing ontology for predictive maintenance and production continuity across multiple plants. Include Asset, SensorSignal, MaintenanceOrder, FailureMode, SparePart, Technician, ProductionSchedule, and DowntimeEvent entities. Link machine telemetry trends with maintenance history, parts availability, and planned production runs. Add derived indicators such as failure likelihood, mean time between failures by asset class, maintenance backlog risk, and schedule impact score so operations teams can prioritize interventions that minimize line stoppages and customer delivery risk.'
  }
];
