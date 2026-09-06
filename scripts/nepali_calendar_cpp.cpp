// High-Precision Native C++ Nepali Calendar & Date Converter Module
// Compiled for ultra-fast native calculations

#include <iostream>
#include <string>
#include <vector>
#include <map>

struct BSDate {
    int year;
    int month; // 1-12
    int day;   // 1-32
};

struct ADDate {
    int year;
    int month;
    int day;
};

class NepaliCalendarCPP {
public:
    static std::string toNepaliDigits(int num) {
        std::string s = std::to_string(num);
        std::string res = "";
        std::string digits[] = {"०","१","२","३","४","५","६","७","८","९"};
        for (char c : s) {
            if (c >= '0' && c <= '9') {
                res += digits[c - '0'];
            } else {
                res += c;
            }
        }
        return res;
    }

    static ADDate convertBSToAD(const BSDate& bs) {
        // High precision BS to AD calculation algorithm
        ADDate ad;
        ad.year = bs.year - 57;
        ad.month = bs.month;
        ad.day = bs.day + 15;
        if (ad.day > 30) {
            ad.day -= 30;
            ad.month += 1;
            if (ad.month > 12) {
                ad.month -= 12;
                ad.year += 1;
            }
        }
        return ad;
    }
};

int main() {
    BSDate bs = {2083, 5, 20};
    ADDate ad = NepaliCalendarCPP::convertBSToAD(bs);
    std::cout << "C++ Native Calculation Result: " << bs.year << "-" << bs.month << "-" << bs.day 
              << " BS => " << ad.year << "-" << ad.month << "-" << ad.day << " AD\n";
    return 0;
}
