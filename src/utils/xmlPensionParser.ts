import { PensionProduct } from "@/types/pension";
import JSZip from "jszip";

export class XMLPensionParser {
  static async parseZIPFile(file: File): Promise<{
    clientName: string;
    clientId: string;
    clientPhone?: string;
    clientEmail?: string;
    reportDate: string;
    products: PensionProduct[];
  }> {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(file);
    
    // מציאת כל קבצי ה-XML בתוך ה-ZIP
    const xmlFiles = Object.keys(zipContent.files).filter(
      filename => filename.toLowerCase().endsWith('.xml') && !zipContent.files[filename].dir
    );

    if (xmlFiles.length === 0) {
      throw new Error("לא נמצאו קבצי XML בקובץ ה-ZIP");
    }

    // פרסור כל קבצי ה-XML
    const allProducts: PensionProduct[] = [];
    let clientName = "";
    let clientId = "";
    let clientPhone = "";
    let clientEmail = "";
    let reportDate = "";

    for (const xmlFilename of xmlFiles) {
      try {
        const xmlContent = await zipContent.files[xmlFilename].async("text");
        const blob = new Blob([xmlContent], { type: "text/xml" });
        const xmlFile = new File([blob], xmlFilename, { type: "text/xml" });
        
        const result = await this.parseXMLFile(xmlFile);
        
        // שומרים את פרטי הלקוח מהקובץ האחרון (מעדכנים בכל איטרציה)
        clientName = result.clientName;
        clientId = result.clientId;
        if (result.clientPhone) clientPhone = result.clientPhone;
        if (result.clientEmail) clientEmail = result.clientEmail;
        reportDate = result.reportDate;
        
        // מוסיפים את המוצרים מהקובץ הנוכחי
        allProducts.push(...result.products);
      } catch (error) {
        console.warn(`שגיאה בפרסור קובץ ${xmlFilename}:`, error);
      }
    }

    if (allProducts.length === 0) {
      throw new Error("לא נמצאו מוצרים תקינים בקבצי ה-XML");
    }

    return {
      clientName,
      clientId,
      clientPhone: clientPhone || undefined,
      clientEmail: clientEmail || undefined,
      reportDate,
      products: allProducts
    };
  }

  static async parseXMLFile(file: File): Promise<{
    clientName: string;
    clientId: string;
    clientPhone?: string;
    clientEmail?: string;
    reportDate: string;
    products: PensionProduct[];
  }> {
    const text = await file.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");

    // בדיקת שגיאות פרסור
    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
      throw new Error("שגיאה בפרסור קובץ XML");
    }

    // חילוץ פרטי לקוח
    const clientElement = xmlDoc.querySelector("YeshutLakoach");
    const clientName = this.getElementText(clientElement, "SHEM-PRATI") + " " + 
                       this.getElementText(clientElement, "SHEM-MISHPACHA");
    const clientId = this.getElementText(clientElement, "MISPAR-ZIHUY-LAKOACH");
    
    // חילוץ פרטי התקשרות - מחפש מספר אפשרויות שונות
    let clientPhone = "";
    let clientEmail = "";
    
    if (clientElement) {
      // ניסיון לקרוא טלפון מכמה שדות אפשריים
      clientPhone = this.getElementText(clientElement, "TELEFON") ||
                    this.getElementText(clientElement, "MISPAR-TELEFON") ||
                    this.getElementText(clientElement, "TELEPHONE") ||
                    this.getElementText(clientElement, "PHONE") ||
                    "";
      
      // ניסיון לקרוא אימייל מכמה שדות אפשריים
      clientEmail = this.getElementText(clientElement, "DO-EL") ||
                    this.getElementText(clientElement, "EMAIL") ||
                    this.getElementText(clientElement, "DUAR-ELECTRONI") ||
                    this.getElementText(clientElement, "E-MAIL") ||
                    "";
    }

    // תאריך דוח
    const reportDate = this.formatDate(this.getElementText(xmlDoc, "TAARICH-BITZUA"));

    // חילוץ מוצרים
    const mutzarimElements = xmlDoc.querySelectorAll("Mutzar");
    const products: PensionProduct[] = [];

    mutzarimElements.forEach((mutzar, index) => {
      try {
        const product = this.parseMutzar(mutzar, index);
        if (product) {
          products.push(product);
        }
      } catch (error) {
        console.warn("שגיאה בפרסור מוצר:", error);
      }
    });

    return {
      clientName,
      clientId,
      clientPhone: clientPhone || undefined,
      clientEmail: clientEmail || undefined,
      reportDate,
      products
    };
  }

  private static parseMutzar(mutzar: Element, index: number): PensionProduct | null {
    const heshbon = mutzar.querySelector("HeshbonOPolisa");
    if (!heshbon) return null;

    // סוג מוצר
    const sugMutzar = this.getElementText(mutzar, "SUG-MUTZAR");
    const productType = this.mapProductType(sugMutzar);
    if (!productType) return null;

    // חברה
    const company = this.getElementText(heshbon, "SHEM-TOCHNIT") || 
                   this.getElementText(mutzar, "SHEM-YATZRAN", "YeshutYatzran") ||
                   "לא ידוע";

    // מספר פוליסה
    const policyNumber = this.getElementText(heshbon, "MISPAR-POLISA-O-HESHBON");

    // סטטוס
    const statusCode = this.getElementText(heshbon, "STATUS-POLISA-O-CHESHBON");
    const status = statusCode === "1" || statusCode === "2" ? "פעיל" : "לא פעיל";

    // יתרה נוכחית - מחפשים באלמנט Tzvira
    const tzviraElements = heshbon.querySelectorAll("PerutMasluleiHashkaa");
    let currentBalance = 0;
    tzviraElements.forEach(elem => {
      const amount = parseFloat(this.getElementText(elem, "SCHUM-TZVIRA-BAMASLUL") || "0");
      currentBalance += amount;
    });

    // דמי ניהול
    const managementFeeFromBalance = parseFloat(
      this.getElementText(heshbon, "SHEUR-DMEI-NIHUL-HISACHON", "PerutMasluleiHashkaa") || "0"
    );
    const managementFeeFromDeposit = parseFloat(
      this.getElementText(heshbon, "SHEUR-DMEI-NIHUL-HAFKADA", "PerutMasluleiHashkaa") || "0"
    );

    // תשואה שנתית
    const annualReturn = parseFloat(
      this.getElementText(heshbon, "SHEUR-TSUA-NETO", "Tsua") || "0"
    );

    // הפקדות אחרונות
    const employeeDeposit = parseFloat(
      this.getElementText(heshbon, "TOTAL-HAFKADOT-OVED-TAGMULIM-SHANA-NOCHECHIT", "HafkadotShnatiyot") || "0"
    );
    const employerDeposit = parseFloat(
      this.getElementText(heshbon, "TOTAL-HAFKADOT-MAAVID-TAGMULIM-SHANA-NOCHECHIT", "HafkadotShnatiyot") || "0"
    );

    // יתרה צפויה בפרישה
    const projectedBalance = parseFloat(
      this.getElementText(heshbon, "TOTAL-CHISACHON-MITZTABER-TZAFUY", "YitraLefiGilPrisha") || 
      currentBalance.toString()
    );

    // קצבה חודשית צפויה
    const projectedMonthlyPension = parseFloat(
      this.getElementText(heshbon, "KITZVAT-HODSHIT-TZFUYA", "Kupot Kupa") || "0"
    );

    // כיסוי ביטוחי
    const deathBenefit = parseFloat(
      this.getElementText(heshbon, "SCHUM-BITUACH", "PerutMitryot") || "0"
    );

    // תאריך פתיחת תוכנית
    const planOpenDate = this.formatDate(
      this.getElementText(heshbon, "TAARICH-HITZTARFUT-MUTZAR")
    );

    // זכאות למשיכה
    const eligibleForWithdrawal = this.determineWithdrawalEligibility(heshbon, productType);

    const product: PensionProduct = {
      id: `xml-${policyNumber}-${index}`,
      company: this.cleanCompanyName(company),
      productType,
      policyNumber,
      status,
      currentBalance,
      managementFeeFromDeposit,
      managementFeeFromBalance,
      annualReturn,
      projectedBalanceAtRetirement: projectedBalance,
      planOpenDate
    };

    // הוספת הפקדות אם קיימות
    if (employeeDeposit > 0 || employerDeposit > 0) {
      product.lastDeposit = {
        employee: employeeDeposit,
        employer: employerDeposit
      };
    }

    // הוספת קצבה צפויה אם קיימת
    if (projectedMonthlyPension > 0) {
      product.projectedMonthlyPension = projectedMonthlyPension;
    }

    // הוספת כיסוי ביטוחי אם קיים
    if (deathBenefit > 0) {
      product.insuranceCoverage = {
        deathBenefit,
        disabilityBenefit: 0
      };
    }

    // זכאות למשיכה
    if (eligibleForWithdrawal) {
      product.eligibleForWithdrawal = eligibleForWithdrawal;
    }

    return product;
  }

  private static mapProductType(sugMutzar: string): PensionProduct['productType'] | null {
    // מיפוי קודי סוג מוצר לפי התקן הישראלי
    const typeMap: Record<string, PensionProduct['productType']> = {
      "1": "קרן פנסיה חדשה",
      "2": "קופת גמל",
      "3": "קופת גמל", // קופת גמל להשקעה
      "4": "קרן השתלמות",
      "5": "חברת ביטוח",
      "6": "ביטוח משכנתא"
    };

    return typeMap[sugMutzar] || null;
  }

  private static determineWithdrawalEligibility(
    heshbon: Element, 
    productType: PensionProduct['productType']
  ): string | boolean | undefined {
    // קרנות השתלמות - בדיקה לפי תאריך הצטרפות
    if (productType === "קרן השתלמות") {
      const joinDate = this.getElementText(heshbon, "TAARICH-HITZTARFUT-MUTZAR");
      if (joinDate) {
        const years = this.calculateYearsSince(joinDate);
        if (years >= 6) {
          return "ניתן למשיכה";
        } else {
          const eligibleDate = new Date(this.parseDate(joinDate));
          eligibleDate.setFullYear(eligibleDate.getFullYear() + 6);
          return eligibleDate.toLocaleDateString('he-IL');
        }
      }
    }

    // קופות גמל - בדיקה לפי גיל
    if (productType === "קופת גמל") {
      const gilPrisha = this.getElementText(heshbon, "GIL-PRISHA", "YitraLefiGilPrisha");
      if (gilPrisha) {
        return `גיל פרישה: ${gilPrisha}`;
      }
    }

    return undefined;
  }

  private static cleanCompanyName(name: string): string {
    // ניקוי שם החברה מתווים מיותרים
    return name
      .replace(/בע"מ/g, '')
      .replace(/ניהול קופות גמל/g, '')
      .replace(/קרן השתלמות/g, '')
      .trim();
  }

  private static getElementText(
    parent: Element | Document | null, 
    tagName: string,
    subParent?: string
  ): string {
    if (!parent) return "";
    
    let searchElement: Element | Document | null = parent;
    
    if (subParent) {
      const subElement = parent.querySelector(subParent);
      if (subElement) {
        searchElement = subElement;
      }
    }
    
    const element = searchElement?.querySelector(tagName);
    return element?.textContent?.trim() || "";
  }

  private static formatDate(dateStr: string): string {
    if (!dateStr || dateStr.length !== 8) return "";
    
    // פורמט: YYYYMMDD
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    
    return `${day}/${month}/${year}`;
  }

  private static parseDate(dateStr: string): Date {
    if (!dateStr || dateStr.length !== 8) return new Date();
    
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1; // חודשים ב-JS מתחילים מ-0
    const day = parseInt(dateStr.substring(6, 8));
    
    return new Date(year, month, day);
  }

  private static calculateYearsSince(dateStr: string): number {
    const date = this.parseDate(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(diffYears);
  }
}
