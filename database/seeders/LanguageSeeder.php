<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Language;

class LanguageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $languages = [
            ['name' => 'English', 'code' => 'en', 'sort_order' => 1],
            ['name' => 'Urdu', 'code' => 'ur', 'sort_order' => 2],
            ['name' => 'Punjabi', 'code' => 'pa', 'sort_order' => 3],
            ['name' => 'Sindhi', 'code' => 'sd', 'sort_order' => 4],
            ['name' => 'Pashto', 'code' => 'ps', 'sort_order' => 5],
            ['name' => 'Balochi', 'code' => 'bal', 'sort_order' => 6],
        ];

        foreach ($languages as $language) {
            Language::updateOrCreate(
                ['code' => $language['code']],
                $language
            );
        }
    }
}
