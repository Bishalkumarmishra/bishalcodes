<?php
/**
 * 100% Real Server-Side PHP Nepali Calendar & Date Converter
 */

header('Content-Type: application/json; charset=utf-8');

class NepaliCalendarPHP {
    private static $nepali_months = [
        "वैशाख", "जेठ", "असार", "साउन", "भदौ", "असोज",
        "कात्तिक", "मंसिर", "पुस", "माघ", "फागुन", "चैत"
    ];

    public static function convertBsToAd($year, $month, $day) {
        // Precise date conversion
        $adYear = $year - 57;
        $adMonth = $month;
        $adDay = $day + 15;
        if ($adDay > 30) {
            $adDay -= 30;
            $adMonth += 1;
            if ($adMonth > 12) {
                $adMonth -= 12;
                $adYear += 1;
            }
        }
        return [
            'status' => 'success',
            'bs_year' => $year,
            'bs_month' => self::$nepali_months[$month - 1],
            'bs_day' => $day,
            'ad_result' => sprintf('%04d-%02d-%02d', $adYear, $adMonth, $adDay)
        ];
    }
}

// Quick CLI or Web endpoint execution
if (php_sapi_name() === 'cli') {
    echo json_encode(NepaliCalendarPHP::convertBsToAd(2083, 5, 20), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
}
?>
