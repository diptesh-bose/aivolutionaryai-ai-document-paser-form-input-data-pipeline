
import { FormFieldDefinition } from './types';

export const APP_TITLE = "AI Document Parser & Template Manager";

export const GEMINI_MODEL_TEXT = 'gemini-2.5-flash-preview-04-17'; // For text and multimodal tasks

export const DEFAULT_PARSER_TEMPLATE_ID = 'default_invoice_parser';

export const DEFAULT_FORM_SCHEMA: FormFieldDefinition[] = [
  { id: 'invoiceNumber', label: 'Invoice Number', type: 'text', placeholder: 'e.g., 5465456' },
  { id: 'invoiceDate', label: 'Invoice Date', type: 'date' },
  { id: 'dueDate', label: 'Due Date', type: 'date' },

  { id: 'billToName', label: 'Bill To: Name', type: 'text', placeholder: 'Company or person billed' },
  { id: 'billToAddress', label: 'Bill To: Address', type: 'textarea', placeholder: 'Full address of the recipient, e.g., Texas, TX9909' },
  { id: 'billToRegNr', label: 'Bill To: Registration Nr.', type: 'text', placeholder: 'e.g., RCF2393993' },
  { id: 'billToTaxNr', label: 'Bill To: Tax Nr.', type: 'text', placeholder: 'e.g., BT9087906587' },

  { id: 'sellerName', label: 'Seller: Name', type: 'text', placeholder: 'e.g., Seller.Com' },
  { id: 'sellerAddress', label: 'Seller: Address', type: 'textarea', placeholder: 'Full address of the seller, e.g., California, 28973' },
  { id: 'sellerRegNr', label: 'Seller: Registration Nr.', type: 'text', placeholder: 'e.g., LB8923048' },
  { id: 'sellerTaxNr', label: 'Seller: Tax Nr.', type: 'text', placeholder: 'e.g., BT908345' },
  { id: 'sellerPhone', label: 'Seller: Phone', type: 'tel', placeholder: 'e.g., 453-223-0987' },

  { id: 'serviceDescription', label: 'Description of Services/Items', type: 'textarea', placeholder: 'Summary of items or services, e.g., Inbound logistics services, Outbound logistics services' },
  
  { id: 'subtotalAmount', label: 'Subtotal Amount', type: 'number', placeholder: 'e.g., 18000.00' },
  { id: 'taxAmount', label: 'Tax Amount', type: 'number', placeholder: 'e.g., 0.00' },
  { id: 'totalAmount', label: 'Total Amount', type: 'number', placeholder: 'e.g., 18000.00' },

  { id: 'bankName', label: 'Bank Name', type: 'text', placeholder: 'e.g., American Bank' },
  { id: 'bankAccountNumber', label: 'Bank Account Number', type: 'text', placeholder: 'e.g., 7856478561347' },
  { id: 'bankBIC', label: 'Bank BIC/SWIFT', type: 'text', placeholder: 'e.g., 3454' },
  
  { id: 'notes', label: 'Additional Notes From Document', type: 'textarea', placeholder: 'Any other relevant text like "Please approve" or payment terms...' }
];

export const MAX_FILE_SIZE_MB = 10; 
// Schema generation will initially focus on PDF, but keep these for extraction
export const ACCEPTED_FILE_TYPES_EXTRACTION = "application/pdf, image/jpeg, image/png, image/webp, text/plain";
export const ACCEPTED_FILE_TYPES_SCHEMA_GENERATION = "application/pdf";


export const GEMINI_EXTRACTION_SYSTEM_INSTRUCTION = `You are an expert data extraction assistant. Your task is to meticulously extract information from the provided document (image, PDF, or text) and populate a JSON object based on the fields provided in the user's prompt.
The document is typically an invoice or a similar structured document.
If a piece of information is not clearly found for a specific field, use null or an empty string ("") for its value. Do not invent information.
Prioritize accuracy.
Format dates as YYYY-MM-DD if possible, otherwise use the given format.
For numerical amounts, provide them as numerical values without currency symbols or thousand separators if possible (e.g., "$18,000.00" should become 18000.00).
Respond ONLY with a valid JSON object. Do not include any explanatory text, markdown formatting (like \`\`\`json), or comments before or after the JSON.
Your entire response should be parseable as JSON.`;


export const GEMINI_SCHEMA_GENERATION_SYSTEM_INSTRUCTION = `You are an expert UI and data schema designer. Your task is to analyze the provided PDF document (likely an invoice, form, or structured document) and propose a JSON schema for extracting data from it.
This schema will be used to generate a data entry form.

Carefully examine the document structure, field labels, and data formats.
For each relevant piece of information you identify as a distinct field for data extraction, define an object with the following properties:
- "id": A unique, machine-readable identifier for the field, in camelCase (e.g., "invoiceNumber", "customerName", "transactionDate"). This should be derived from the field's purpose or label.
- "label": A human-readable label for the form field (e.g., "Invoice Number", "Customer Name", "Transaction Date"). This should closely match the label in the document if available, or be a clear description.
- "type": The most appropriate data type for the field. Choose from: 'text', 'date', 'number', 'textarea', 'email', 'tel'.
  - Use 'date' for dates. (Try to recognize various date formats)
  - Use 'number' for numerical values like amounts, quantities.
  - Use 'textarea' for multi-line text fields like addresses or long descriptions/notes.
  - Use 'email' for email addresses.
  - Use 'tel' for phone numbers.
  - Use 'text' for general single-line text inputs.
- "placeholder": (Optional) A short, example placeholder text for the input field (e.g., "INV-00123", "Enter customer's full name", "YYYY-MM-DD"). If unsure, omit or use an empty string.
- "required": A boolean indicating if the field seems mandatory based on common practices for such documents. Default to false if unsure.

Output ONLY a valid JSON array of these field definition objects.
Do NOT include any explanatory text, comments, or markdown formatting (like \\\`\\\`\\\`json) before or after the JSON array.
The entire response must be a single JSON array.

Example of a field definition object:
{
  "id": "invoiceTotal",
  "label": "Invoice Total",
  "type": "number",
  "placeholder": "e.g., 123.45",
  "required": true
}

Analyze the whole document and identify all key fields. If the document has line items, you can suggest a 'textarea' field named "lineItemsSummary" or similar to capture overall item details, or individual fields if a very clear, repeating tabular structure for items (like description, quantity, unitPrice, lineTotal) is present across many items. For a first pass, a summary field is often safer.
Focus on creating a practical and comprehensive schema for data extraction from THIS type of document. Ensure IDs are valid JavaScript identifiers (camelCase).
Try to identify up to 20-25 distinct fields. If many more are present, focus on the most important ones.
For addresses, try to parse them into distinct fields like 'streetAddress', 'city', 'state', 'postalCode', 'country' if clearly separable, otherwise use a single 'textarea' for 'fullAddress'.
`;
// Renamed old GEMINI_SYSTEM_INSTRUCTION to GEMINI_EXTRACTION_SYSTEM_INSTRUCTION
// The actual prompt sent to Gemini for extraction will be built by buildExtractionPrompt in geminiService.ts
// to include the specific fields from the active schema.