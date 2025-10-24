# מדריך אינטגרציה של חשיפות מהמסלקה הפנסיונית

## מה הוקם עד כה:

### 1. קבצי XML
- הועתקו 3 קבצים: `gemel.xml`, `pensia.xml`, `hevrot.xml` לתיקיית `src/data/`

### 2. מנתח קוד מסלול (`src/utils/maslulCodeParser.ts`)
- פענוח קוד 30 ספרות (KOD-MASLUL-HASHKA)
- חילוץ: ח.פ גוף מוסדי, אישור מס הכנסה, מספר מסלול

### 3. מנתח XML חשיפות (`src/utils/exposureXmlParser.ts`)
- `ExposureXmlParser.loadXmlFiles()` - טעינת הקבצים
- `findGemelExposure(idKupa)` - חיפוש לגמל/השתלמות
- `findPensiaExposure(idMaslulRishuy)` - חיפוש לפנסיה
- `findInsuranceExposure(idGuf)` - חיפוש לביטוח (4731)

### 4. טיפוסים מעודכנים (`src/types/pension.ts`)
- הוספת `maslulCode` ל-PensionProduct
- הוספת `DetailedExposureData` עם כל סוגי החשיפות

### 5. רכיב תצוגה (`src/components/ProductSelector/ProductExposureDetail.tsx`)
- דיאלוג להצגת פירוט חשיפות מלא

### 6. עדכון פרסר XML (`src/utils/xmlPensionParser.ts`)
- חילוץ KOD-MASLUL-HASHKA מהקובץ

## שלבים להמשך הפיתוח:

1. **ב-PensionFileImport**: הוסף קריאה ל-`ExposureXmlParser.loadXmlFiles()` בעת טעינת הקובץ
2. לכל מוצר, חלץ את מספר אישור מס הכנסה מה-maslulCode באמצעות `MaslulCodeParser`
3. חפש חשיפות לפי סוג המוצר:
   - פנסיה → `findPensiaExposure(taxApprovalNumber)`
   - גמל/השתלמות → `findGemelExposure(taxApprovalNumber)`
   - ביטוח → `findInsuranceExposure("4731")`
4. הוסף כפתור "צפה במידע נוסף" לכל מוצר שפותח את `ProductExposureDetail`
5. חשב אג"ח כממוצע של 3 סוגי האג"ח

## דוגמת קוד לשימוש:

```typescript
import { MaslulCodeParser } from "@/utils/maslulCodeParser";
import { ExposureXmlParser } from "@/utils/exposureXmlParser";

// טעינה חד פעמית
await ExposureXmlParser.loadXmlFiles();

// לכל מוצר
const parts = MaslulCodeParser.parseMaslulCode(product.maslulCode);
if (parts) {
  const exposure = await ExposureXmlParser.findPensiaExposure(parts.taxApprovalNumber);
  product.detailedExposure = exposure;
}
```
