function getTotalUsageMB(records) {
    return records.reduce((total, record) => {
        return total + record.dataUsageMB;
    }, 0);
}

const records = [
    { dataUsageMB: 1500 },
    { dataUsageMB: 1200 },
    { dataUsageMB: 6000 }
];

console.log("Total Usage:", getTotalUsageMB(records));
console.log("Empty Records:", getTotalUsageMB([]));
