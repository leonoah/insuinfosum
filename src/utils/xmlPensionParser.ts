import { PensionProduct } from "@/types/pension";
import JSZip from "jszip";

export class XMLPensionParser {
  static async parseXMLText(xmlText: string, filename?: string): Promise<{
    clientName: string;
    clientId: string;
    reportDate: string;
    products: PensionProduct[];
  }> {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
      throw new Error("שגיאה בפרסור קובץ XML" + (filename ? ` (${filename})` : ""));
    }

    const clientElement = this.getFirstByLocalName(xmlDoc, "YeshutLakoach");
    const clientName = this.getElementText(clientElement, "SHEM-PRATI") + " " + 
                       this.getElementText(clientElement, "SHEM-MISHPACHA");
    const clientId = this.getElementText(clientElement, "MISPAR-ZIHUY-LAKOACH");

    const reportDate = this.formatDate(this.getElementText(xmlDoc, "TAARICH-BITZUA"));

    const mutzarimElements = Array.from(this.getAllByLocalName(xmlDoc, "Mutzar"));
    const products: PensionProduct[] = [];
    let runningIndex = 0;

    for (const mutzar of mutzarimElements) {
      const heshbonElements = this.getAllByLocalName(mutzar, "HeshbonOPolisa");
      if (heshbonElements.length > 0) {
        for (const heshbon of heshbonElements) {
          try {
            const product = this.parseHeshbon(mutzar, heshbon, runningIndex++);
            if (product) products.push(product);
          } catch (error) {
            console.warn("שגיאה בפרסור חשבון/פוליסה:", error);
          }
        }
      } else {
        try {
          const product = this.parseMutzar(mutzar, runningIndex++);
          if (product) products.push(product);
        } catch (error) {
          console.warn("שגיאה בפרסור מוצר:", error);
        }
      }
    }

    return {
      clientName,
      clientId,
      reportDate,
      products
    };
  }
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
        const result = await this.parseXMLText(xmlContent, xmlFilename);
        
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
<<<<<<< HEAD
    return this.parseXMLText(text, file.name);
  }

  private static parseMutzar(mutzar: Element, index: number): PensionProduct | null {
    const heshbon = this.getElementByLocalPath(mutzar, ["HeshbonotOPolisot", "HeshbonOPolisa"]) ||
                    this.getFirstByLocalName(mutzar, "HeshbonOPolisa");
    if (!heshbon) return null;
=======
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");

    // בדיקת שגיאות פרסור
    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
      throw new Error("שגיאה בפרסור קובץ XML");
    }

    // חילוץ פרטי לקוח
    const clientElement = xmlDoc.querySelector("YeshutLakoach, Lakoach, PrateiLakoach, Pratei-Lakoach");
    const firstName = this.getFirstTextByTags(clientElement || xmlDoc, ["SHEM-PRATI","SHEM-PRATI-LAKOACH"]);
    const lastName = this.getFirstTextByTags(clientElement || xmlDoc, ["SHEM-MISHPACHA","SHEM-MISHPACHA-LAKOACH"]);
    const clientName = (firstName + " " + lastName).trim() || this.getFirstTextByTags(clientElement || xmlDoc, ["SHEM-MALE","SHEM-MALE-LAKOACH"]) || "";
    const clientId = this.getFirstTextByTags(clientElement || xmlDoc, ["MISPAR-ZIHUY-LAKOACH","MISPAR-ZEHUT","MISPAR-TEUDAT-ZEHUT","TEUDAT-ZEHUT","MISPAR-ZIHUY"]);
    
    // חילוץ פרטי התקשרות - מחפש מספר אפשרויות שונות
    const clientPhone = this.getFirstTextByTags(clientElement || xmlDoc, [
      "MISPAR-CELLULARI","MISPAR-SELULARI","CELLULAR","MOBILE",
      "TELEFON","MISPAR-TELEFON","TELEPHONE","PHONE","MISPAR-PHONE"
    ]);
    const clientEmail = this.getFirstTextByTags(clientElement || xmlDoc, [
      "DO-EL","DOAR-ELECTRONI","DUAR-ELECTRONI","EMAIL","E-MAIL"
    ]);

    // תאריך דוח
    const reportDateRaw = this.getFirstTextByTags(xmlDoc, ["TAARICH-BITZUA","TAARICH-DUACH","TAARICH-DUCH"]);
    const reportDate = this.formatDate(reportDateRaw);

    // חילוץ מוצרים
    const products: PensionProduct[] = [];
    const seenPolicyNumbers = new Set<string>();

    // אוספים כל מיכלי המוצרים האפשריים
    const productContainers = this.getProductContainers(xmlDoc);

    productContainers.forEach((mutzar, index) => {
      try {
        const product = this.parseMutzar(mutzar, index);
        if (product) {
          // בדיקת כפילויות לפי מספר פוליסה
          const policyKey = `${product.company}-${product.policyNumber}`;
          if (!seenPolicyNumbers.has(policyKey)) {
            seenPolicyNumbers.add(policyKey);
            products.push(product);
          }
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
    const heshbon = (mutzar.querySelector("HeshbonOPolisa, Heshbon-O-Polisa, Heshbon, Polisa") as Element) || mutzar;
>>>>>>> 38b59357463e8b70c809ebe803110c5615c00767

    // סוג מוצר
    const sugMutzar = this.getFirstTextByTags(mutzar, ["SUG-MUTZAR","SUG-MUTZAR-TEXT","SHEM-SUG-MUTZAR","SUG-MUTZAR-MILULI"]) || "";
    let productType = this.mapProductType(sugMutzar);
    if (!productType) {
      const contextText = [
        this.getFirstTextByTags(heshbon, ["SHEM-TOCHNIT","SHEM-GUF-MENAHAL","SHEM-MASLUL"]),
        this.getFirstTextByTags(mutzar, ["SHEM-MUTZAR","SUG-MUTZAR-TEXT","SUG-MUTZAR-MILULI"]) ,
      ].filter(Boolean).join(" ");
      productType = this.mapProductType(contextText) || undefined;

      // ניסיון נוסף לפי מילות מפתח בטקסט ההקשר
      if (!productType) {
        const low = contextText.toLowerCase();
        if (low.includes("השתלמ")) productType = "קרן השתלמות";
        else if (low.includes("גמל")) productType = "קופת גמל";
        else if (low.includes("פנסי")) productType = "קרן פנסיה חדשה";
        else if (low.includes("משכנת")) productType = "ביטוח משכנתא";
        else if (low.includes("ביטוח") || low.includes("פוליס")) productType = "חברת ביטוח";
      }
    }

    // אם עדיין לא הצלחנו לסווג – לא נוותר על המוצר
    if (!productType) productType = "קופת גמל";

    // חברה
    const company = this.getFirstTextByTags(heshbon, ["SHEM-TOCHNIT","SHEM-GUF-MENAHAL"]) || 
                   this.getFirstTextByTags(mutzar, ["SHEM-YATZRAN","SHEM-YATZARAN","SHEM-YATSRAN"], "YeshutYatzran") ||
                   "לא ידוע";

    // מספר פוליסה
    const policyNumber = this.getFirstTextByTags(heshbon, ["MISPAR-POLISA-O-HESHBON","MISPAR-POLISA","MISPAR-HESHBON"]);

    // סטטוס
    const statusCode = this.getFirstTextByTags(heshbon, ["STATUS-POLISA-O-CHESHBON","STATUS-POLISA-O-HESHBON","STATUS-HESHBON"]);
    const status = statusCode === "1" || statusCode === "2" ? "פעיל" : "לא פעיל";

    // יתרה נוכחית - מחפשים באלמנט Tzvira
<<<<<<< HEAD
    const tzviraElements = this.getAllByLocalName(heshbon, "PerutMasluleiHashkaa");
=======
    const tzviraElements = heshbon.querySelectorAll("PerutMasluleiHashkaa, PerutMaslul, PerutMaslulHashkaa");
>>>>>>> 38b59357463e8b70c809ebe803110c5615c00767
    let currentBalance = 0;
    tzviraElements.forEach(elem => {
      const amount = parseFloat(this.getElementText(elem, "SCHUM-TZVIRA-BAMASLUL") || "0");
      currentBalance += amount;
    });
<<<<<<< HEAD
    // Fallback to total net accumulation under Tzvirot if available
    if (currentBalance === 0) {
      const totalTzviraNeto = parseFloat(
        this.getElementText(heshbon, "TOTAL-TZVIRA-NETO", "Tzvirot") || "0"
      );
      if (!isNaN(totalTzviraNeto) && totalTzviraNeto > 0) {
        currentBalance = totalTzviraNeto;
      }
=======
    if (currentBalance === 0) {
      const yitra = parseFloat(this.getFirstTextByTags(heshbon, ["YITRA-NOCHECHIT","YITRA-NOCHACHIT","YITRA"]) || "0");
      if (!isNaN(yitra) && yitra > 0) currentBalance = yitra;
>>>>>>> 38b59357463e8b70c809ebe803110c5615c00767
    }

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
    let employeeDeposit = parseFloat(
      this.getElementText(heshbon, "TOTAL-HAFKADOT-OVED-TAGMULIM-SHANA-NOCHECHIT", "HafkadotShnatiyot") || "0"
    );
    let employerDeposit = parseFloat(
      this.getElementText(heshbon, "TOTAL-HAFKADOT-MAAVID-TAGMULIM-SHANA-NOCHECHIT", "HafkadotShnatiyot") || "0"
    );
    if ((!employeeDeposit && !employerDeposit) || (isNaN(employeeDeposit) && isNaN(employerDeposit))) {
      const totalLastDeposit = parseFloat(
        this.getElementText(heshbon, "TOTAL-HAFKADA", "PirteiHafkadaAchrona") ||
        this.getElementText(heshbon, "TOTAL-HAFKADA", "PerutPirteiHafkadaAchrona") || "0"
      );
      if (!isNaN(totalLastDeposit) && totalLastDeposit > 0) {
        employeeDeposit = totalLastDeposit;
        employerDeposit = 0;
      }
    }

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
    let deathBenefit = parseFloat(
      this.getElementText(heshbon, "SCHUM-BITUACH", "PerutMitryot") || "0"
    );
    if (!deathBenefit || isNaN(deathBenefit)) {
      const altDeath = parseFloat(
        this.getElementText(heshbon, "SCHUM-BITUAH-ZAKAI", "PerutAchreiutKlalit") || "0"
      );
      if (!isNaN(altDeath) && altDeath > 0) {
        deathBenefit = altDeath;
      }
    }

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

  private static parseHeshbon(mutzar: Element, heshbon: Element, index: number): PensionProduct | null {
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

    // יתרה נוכחית
    const tzviraElements = this.getAllByLocalName(heshbon, "PerutMasluleiHashkaa");
    let currentBalance = 0;
    tzviraElements.forEach(elem => {
      const amount = parseFloat(this.getElementText(elem, "SCHUM-TZVIRA-BAMASLUL") || "0");
      currentBalance += amount;
    });
    if (currentBalance === 0) {
      const totalTzviraNeto = parseFloat(
        this.getElementText(heshbon, "TOTAL-TZVIRA-NETO", "Tzvirot") || "0"
      );
      if (!isNaN(totalTzviraNeto) && totalTzviraNeto > 0) {
        currentBalance = totalTzviraNeto;
      }
    }

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
    let employeeDeposit = parseFloat(
      this.getElementText(heshbon, "TOTAL-HAFKADOT-OVED-TAGMULIM-SHANA-NOCHECHIT", "HafkadotShnatiyot") || "0"
    );
    let employerDeposit = parseFloat(
      this.getElementText(heshbon, "TOTAL-HAFKADOT-MAAVID-TAGMULIM-SHANA-NOCHECHIT", "HafkadotShnatiyot") || "0"
    );
    if ((!employeeDeposit && !employerDeposit) || (isNaN(employeeDeposit) && isNaN(employerDeposit))) {
      const totalLastDeposit = parseFloat(
        this.getElementText(heshbon, "TOTAL-HAFKADA", "PirteiHafkadaAchrona") ||
        this.getElementText(heshbon, "TOTAL-HAFKADA", "PerutPirteiHafkadaAchrona") || "0"
      );
      if (!isNaN(totalLastDeposit) && totalLastDeposit > 0) {
        employeeDeposit = totalLastDeposit;
        employerDeposit = 0;
      }
    }

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
    let deathBenefit = parseFloat(
      this.getElementText(heshbon, "SCHUM-BITUACH", "PerutMitryot") || "0"
    );
    if (!deathBenefit || isNaN(deathBenefit)) {
      const altDeath = parseFloat(
        this.getElementText(heshbon, "SCHUM-BITUAH-ZAKAI", "PerutAchreiutKlalit") || "0"
      );
      if (!isNaN(altDeath) && altDeath > 0) {
        deathBenefit = altDeath;
      }
    }

    // תאריך פתיחת תוכנית
    const planOpenDate = this.formatDate(
      this.getElementText(heshbon, "TAARICH-HITZTARFUT-MUTZAR")
    );

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

    if (employeeDeposit > 0 || employerDeposit > 0) {
      product.lastDeposit = {
        employee: employeeDeposit,
        employer: employerDeposit
      };
    }

    if (projectedMonthlyPension > 0) {
      product.projectedMonthlyPension = projectedMonthlyPension;
    }

    if (deathBenefit > 0) {
      product.insuranceCoverage = {
        deathBenefit,
        disabilityBenefit: 0
      };
    }

    return product;
  }

  private static mapProductType(sugMutzar: string): PensionProduct['productType'] | null {
    // Normalize value (remove leading zeros and trim)
    const s = (sugMutzar || "").trim();
    if (!s) return null;

    const num = s.replace(/^0+/, "");
    const numMap: Record<string, PensionProduct['productType']> = {
      "1": "קרן פנסיה חדשה",
      "2": "קופת גמל",
      "3": "קופת גמל", // קופת גמל להשקעה
      "4": "קרן השתלמות",
      "5": "חברת ביטוח",
      "6": "ביטוח משכנתא",
    };
    if (numMap[num]) return numMap[num];

    // Textual mapping (Hebrew names vary between providers)
    const lower = s.toLowerCase();
    if (lower.includes("פנסי")) return "קרן פנסיה חדשה";
    if (lower.includes("גמל")) return "קופת גמל";
    if (lower.includes("השתלמ")) return "קרן השתלמות";
    if (lower.includes("משכנת")) return "ביטוח משכנתא";
    if (lower.includes("ביטוח") || lower.includes("פוליס")) return "חברת ביטוח";

    return null;
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
    let searchRoot: Element | Document | null = parent;
    if (subParent) {
      const sub = this.getFirstByLocalName(parent, subParent);
      if (sub) searchRoot = sub;
    }
    const element = this.getFirstByLocalName(searchRoot, tagName);
    return element?.textContent?.trim() || "";
  }

  private static getFirstTextByTags(
    parent: Element | Document | null,
    tags: string[],
    subParent?: string
  ): string {
    for (const t of tags) {
      const val = this.getElementText(parent, t, subParent);
      if (val) return val;
    }
    return "";
  }

  // מציאת אב לפי שם תג (Case-Insensitive)
  private static getAncestorByTagName(el: Element | null, names: string[]): Element | null {
    if (!el) return null;
    const targets = names.map((n) => n.toLowerCase());
    let cur: Element | null = el;
    while (cur) {
      if (targets.includes(cur.tagName.toLowerCase())) return cur;
      cur = cur.parentElement;
    }
    return null;
  }

  // איסוף כל מכולות המוצרים האפשריות ממבני XML שונים
  private static getProductContainers(xmlDoc: Document): Element[] {
    const set = new Set<Element>();
    // מבנים נפוצים של "Mutzar"
    xmlDoc.querySelectorAll("Mutzar, Mutzarim > Mutzar, PerutMutzarim > Mutzar, PrateiMutzarim > Mutzar").forEach((e) => set.add(e));
    // מכולות שיש בהן חשבון/פוליסה – נעלה לרמה של ההורה
    xmlDoc
      .querySelectorAll("HeshbonOPolisa, Heshbon-O-Polisa, Heshbon, Polisa")
      .forEach((h) => {
        if (h.parentElement) set.add(h.parentElement);
      });
    // מציאת מוצרים לפי מופע של MISPAR-POLISA-O-HESHBON בכל מקום
    xmlDoc.querySelectorAll("MISPAR-POLISA-O-HESHBON, MISPAR-POLISA, MISPAR-HESHBON").forEach((n) => {
      const el = n as Element;
      const container = this.getAncestorByTagName(el.parentElement, ["Mutzar"]) || el.parentElement;
      if (container) set.add(container);
    });
    return Array.from(set);
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

  // Finds the first descendant element by localName (ignores namespaces)
  private static getFirstByLocalName(parent: Element | Document | null, localName: string): Element | null {
    if (!parent) return null;
    const direct = (parent as Document | Element).querySelector?.(localName) as Element | null;
    if (direct) return direct;
    const list = (parent as Document | Element).getElementsByTagNameNS?.("*", localName) as HTMLCollectionOf<Element> | undefined;
    return list && list.length > 0 ? list[0] : null;
  }

  // Returns all descendant elements with matching localName
  private static getAllByLocalName(parent: Element | Document | null, localName: string): Element[] {
    if (!parent) return [];
    const nodeList = (parent as Document | Element).getElementsByTagNameNS?.("*", localName) as HTMLCollectionOf<Element> | undefined;
    if (nodeList && nodeList.length > 0) return Array.from(nodeList);
    const fallback = (parent as Document | Element).querySelectorAll?.(localName) as NodeListOf<Element> | undefined;
    return fallback ? Array.from(fallback) : [];
  }

  // Traverse a local-name path, e.g., ["HeshbonotOPolisot", "HeshbonOPolisa"]
  private static getElementByLocalPath(root: Element | Document | null, path: string[]): Element | null {
    if (!root) return null;
    let current: Element | Document | null = root;
    for (const segment of path) {
      current = this.getFirstByLocalName(current, segment);
      if (!current) return null;
    }
    return current as Element;
  }
}
