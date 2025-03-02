export function parseCustomDate(dateString: string): Date {
    // Separa la parte de la fecha y la hora
    const [datePart, timePartWithHs] = dateString.split(" ");
    if (!datePart || !timePartWithHs) {
        throw new Error("Formato de fecha inválido.");
    }

    // Elimina el sufijo "hs" de la hora
    const timePart = timePartWithHs.replace("hs", "");

    // Extrae día, mes y año
    const [dayStr, monthStr, yearStr] = datePart.split("/");
    if (!dayStr || !monthStr || !yearStr) {
        throw new Error("Formato de fecha inválido.");
    }
    const day = Number(dayStr);
    const month = Number(monthStr) - 1; // En JavaScript los meses inician en 0
    const year = Number(yearStr);

    // Extrae hora y minutos
    const [hourStr, minuteStr] = timePart.split(":");
    if (!hourStr || !minuteStr) {
        throw new Error("Formato de hora inválido.");
    }
    const hour = Number(hourStr);
    const minute = Number(minuteStr);

    return new Date(year, month, day, hour, minute);
}
