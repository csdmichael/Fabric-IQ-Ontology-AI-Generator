import { Injectable } from '@angular/core';
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType
} from 'docx';
import { saveAs } from 'file-saver';

import { Ontology, OntologyBinding, OntologyEntity, OntologyRelationship } from '../models/ontology.model';

@Injectable({ providedIn: 'root' })
export class OntologyExportService {
  /**
   * Export an ontology to a Microsoft Word `.docx` file with one section per
   * entity, a relationships section, and well-formatted property tables.
   */
  async exportToWord(ontology: Ontology): Promise<void> {
    const children: Array<Paragraph | Table> = [
      new Paragraph({
        text: ontology.name || 'Untitled Ontology',
        heading: HeadingLevel.TITLE
      }),
      new Paragraph({
        children: [new TextRun({ text: ontology.description || '', italics: true })]
      }),
      this.metadataParagraph(ontology),
      new Paragraph({ text: '' }),
      new Paragraph({ text: 'Entities', heading: HeadingLevel.HEADING_1 })
    ];

    for (const entity of ontology.entities ?? []) {
      this.appendEntity(children, entity);
    }

    const relationships = ontology.relationships ?? [];
    children.push(new Paragraph({ text: '' }));
    children.push(new Paragraph({ text: 'Relationships', heading: HeadingLevel.HEADING_1 }));
    if (relationships.length === 0) {
      children.push(new Paragraph({ text: 'No relationships have been defined for this ontology.' }));
    } else {
      children.push(this.relationshipsTable(relationships, ontology.entities ?? []));
    }

    const bindings = ontology.bindings ?? [];
    children.push(new Paragraph({ text: '' }));
    children.push(new Paragraph({ text: 'Data Bindings', heading: HeadingLevel.HEADING_1 }));
    if (bindings.length === 0) {
      children.push(new Paragraph({ text: 'No data bindings have been defined yet.' }));
    } else {
      children.push(this.bindingsTable(bindings, ontology.entities ?? []));
    }

    const doc = new Document({
      creator: 'Fabric IQ Ontology AI Generator',
      title: ontology.name,
      description: ontology.description,
      sections: [{ children }]
    });

    const blob = await Packer.toBlob(doc);
    const fileName = `${(ontology.name || 'ontology').replace(/[^a-z0-9-_]+/gi, '_')}.docx`;
    saveAs(blob, fileName);
  }

  private metadataParagraph(ontology: Ontology): Paragraph {
    const parts: string[] = [`Status: ${ontology.status}`];
    if (ontology.createdBy) parts.push(`Created by: ${ontology.createdBy}`);
    if (ontology.lastModifiedBy) parts.push(`Last modified by: ${ontology.lastModifiedBy}`);
    if (ontology.updatedAt) parts.push(`Updated: ${ontology.updatedAt}`);
    return new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [new TextRun({ text: parts.join('  •  '), size: 20, color: '666666' })]
    });
  }

  private appendEntity(children: Array<Paragraph | Table>, entity: OntologyEntity): void {
    children.push(new Paragraph({ text: '' }));
    children.push(new Paragraph({ text: entity.name, heading: HeadingLevel.HEADING_2 }));
    if (entity.description) {
      children.push(new Paragraph({ text: entity.description }));
    }
    const binding: string[] = [];
    if (entity.sourceTable) binding.push(`Table: ${entity.sourceTable}`);
    if (entity.sourceView) binding.push(`View: ${entity.sourceView}`);
    if (binding.length) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: binding.join('  •  '), italics: true, color: '444444' })]
        })
      );
    }
    children.push(new Paragraph({ text: '' }));
    children.push(this.propertiesTable(entity));
  }

  private propertiesTable(entity: OntologyEntity): Table {
    const headerRow = new TableRow({
      tableHeader: true,
      children: ['Property', 'Data type', 'Description', 'Source table / view', 'Source column'].map(
        (label) =>
          new TableCell({
            shading: { fill: 'EEEEEE' },
            children: [
              new Paragraph({
                children: [new TextRun({ text: label, bold: true })]
              })
            ]
          })
      )
    });

    const propertyRows = (entity.properties ?? []).map((property) => {
      const table = property.sourceTable ?? entity.sourceTable ?? '';
      const view = property.sourceView ?? entity.sourceView ?? '';
      const binding = [table, view].filter(Boolean).join(' / ');
      return new TableRow({
        children: [
          this.cell(property.name + (property.required ? ' *' : '')),
          this.cell(property.type),
          this.cell(property.description ?? ''),
          this.cell(binding),
          this.cell(property.sourceColumn ?? '')
        ]
      });
    });

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...propertyRows]
    });
  }

  private relationshipsTable(relationships: OntologyRelationship[], entities: OntologyEntity[]): Table {
    const lookup = new Map(entities.map((e) => [e.id, e.name]));
    const headerRow = new TableRow({
      tableHeader: true,
      children: ['Name', 'From', 'To', 'Cardinality', 'Description'].map(
        (label) =>
          new TableCell({
            shading: { fill: 'EEEEEE' },
            children: [
              new Paragraph({
                children: [new TextRun({ text: label, bold: true })]
              })
            ]
          })
      )
    });
    const rows = relationships.map(
      (rel) =>
        new TableRow({
          children: [
            this.cell(rel.name),
            this.cell(lookup.get(rel.fromEntityId) ?? rel.fromEntityId),
            this.cell(lookup.get(rel.toEntityId) ?? rel.toEntityId),
            this.cell(rel.cardinality),
            this.cell(rel.description ?? '')
          ]
        })
    );
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...rows]
    });
  }

  private bindingsTable(bindings: OntologyBinding[], entities: OntologyEntity[]): Table {
    const lookup = new Map(entities.map((entity) => [entity.id, entity]));
    const headerRow = new TableRow({
      tableHeader: true,
      children: ['Entity', 'Property', 'Lakehouse table', 'View', 'Source field', 'Notes'].map(
        (label) =>
          new TableCell({
            shading: { fill: 'EEEEEE' },
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })]
          })
      )
    });

    const rows = bindings.map((binding) => {
      const entity = lookup.get(binding.entityId);
      const property = entity?.properties.find((item) => item.id === binding.propertyId);
      return new TableRow({
        children: [
          this.cell(entity?.name ?? binding.entityId),
          this.cell(property?.name ?? (binding.propertyId || 'Entity-level mapping')),
          this.cell(binding.lakehouseTable),
          this.cell(binding.lakehouseView ?? ''),
          this.cell(binding.sourceField),
          this.cell(binding.notes ?? '')
        ]
      });
    });

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...rows]
    });
  }

  private cell(text: string): TableCell {
    return new TableCell({
      children: [new Paragraph({ text })]
    });
  }
}
