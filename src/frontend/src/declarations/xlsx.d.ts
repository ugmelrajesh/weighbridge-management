declare module "xlsx" {
  export interface WorkBook {
    SheetNames: string[];
    Sheets: { [sheet: string]: WorkSheet };
  }
  export interface WorkSheet {
    [cell: string]: CellObject | unknown;
    "!ref"?: string;
  }
  export interface CellObject {
    v?: string | number | boolean | Date;
    w?: string;
    t?: string;
    f?: string;
  }
  export function read(data: unknown, opts?: unknown): WorkBook;
  export function utils_sheet_to_json(worksheet: WorkSheet, opts?: unknown): unknown[];
  export const utils: {
    sheet_to_json<T = unknown>(worksheet: WorkSheet, opts?: unknown): T[];
    json_to_sheet<T = unknown>(data: T[], opts?: unknown): WorkSheet;
    book_new(): WorkBook;
    book_append_sheet(workbook: WorkBook, worksheet: WorkSheet, name?: string): void;
    aoa_to_sheet<T = unknown>(data: T[][], opts?: unknown): WorkSheet;
  };
  export function writeFile(workbook: WorkBook, filename: string, opts?: unknown): void;
  export function write(workbook: WorkBook, opts?: unknown): unknown;
  export const SSF: unknown;
}
