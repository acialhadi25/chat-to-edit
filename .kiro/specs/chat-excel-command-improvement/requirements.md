# Requirements Document

## Introduction

Dokumen ini mendefinisikan persyaratan untuk perbaikan fitur Chat-to-Excel yang bertujuan meningkatkan keandalan parsing perintah AI, memperbaiki tampilan UI chat bubble, dan memastikan semua jenis perintah dapat diterapkan dengan benar. Fitur ini memungkinkan pengguna berinteraksi dengan spreadsheet Excel melalui antarmuka chat berbasis AI.

## Glossary

- **AI_Response_Parser**: Komponen yang mengurai respons JSON dari AI menjadi objek terstruktur
- **Chat_Interface**: Komponen UI yang menampilkan percakapan antara pengguna dan AI
- **Command_Executor**: Komponen yang menerapkan perintah AI ke data Excel
- **Stream_Handler**: Komponen yang menangani streaming respons dari AI
- **System_Prompt**: Template instruksi yang dikirim ke AI untuk memandu format respons
- **Action_Object**: Objek JSON yang berisi tipe perintah dan parameter yang diperlukan
- **Chat_Bubble**: Elemen UI yang menampilkan pesan individual dalam antarmuka chat
- **Text_Transformation**: Operasi mengubah format teks (uppercase, lowercase, title case)
- **Data_Manipulation**: Operasi mengubah, menambah, atau menghapus data dalam spreadsheet
- **Error_Handler**: Komponen yang menangani dan melaporkan kesalahan dengan informatif

## Requirements

### Requirement 1: Parsing Respons AI yang Robust

**User Story:** Sebagai pengguna, saya ingin semua respons AI dapat diparsing dengan benar, sehingga perintah saya selalu dapat dieksekusi tanpa error parsing.

#### Acceptance Criteria

1. WHEN AI mengirimkan respons JSON yang valid, THEN THE AI_Response_Parser SHALL mengurai respons tersebut menjadi Action_Object yang benar
2. WHEN AI mengirimkan respons dengan komentar tambahan di luar JSON, THEN THE AI_Response_Parser SHALL mengekstrak JSON yang valid dan mengabaikan komentar
3. WHEN AI mengirimkan respons dengan JSON yang tidak lengkap atau malformed, THEN THE AI_Response_Parser SHALL menggunakan strategi fallback untuk mengekstrak informasi yang dapat digunakan
4. WHEN parsing gagal sepenuhnya, THEN THE AI_Response_Parser SHALL mengembalikan objek fallback dengan tipe INFO dan pesan error yang jelas
5. WHEN respons berisi array JSON, THEN THE AI_Response_Parser SHALL mengambil elemen pertama sebagai respons utama

### Requirement 2: Pemahaman Perintah Natural Language

**User Story:** Sebagai pengguna, saya ingin AI memahami berbagai variasi perintah dalam bahasa natural, sehingga saya tidak perlu menggunakan sintaks khusus.

#### Acceptance Criteria

1. WHEN pengguna memberikan perintah transformasi teks (contoh: "ubah jadi huruf besar", "capitalize", "lowercase"), THEN THE System_Prompt SHALL menginstruksikan AI untuk menghasilkan Action_Object dengan tipe DATA_TRANSFORM dan transformType yang sesuai
2. WHEN pengguna memberikan perintah formatting (contoh: "warnai merah jika < 0", "bold jika mengandung X"), THEN THE System_Prompt SHALL menginstruksikan AI untuk menghasilkan Action_Object dengan tipe CONDITIONAL_FORMAT dan parameter lengkap
3. WHEN pengguna memberikan perintah data manipulation (contoh: "hapus baris kosong", "sort descending", "filter > 100"), THEN THE System_Prompt SHALL menginstruksikan AI untuk menghasilkan Action_Object dengan tipe dan parameter yang tepat
4. WHEN perintah ambigu atau tidak jelas, THEN THE System_Prompt SHALL menginstruksikan AI untuk menghasilkan Action_Object dengan tipe CLARIFY dan quickOptions untuk klarifikasi
5. WHEN perintah memerlukan parameter wajib (contoh: findValue untuk FIND_REPLACE), THEN THE System_Prompt SHALL menginstruksikan AI untuk selalu menyertakan parameter tersebut dalam Action_Object

### Requirement 3: Tampilan Chat Bubble yang Optimal

**User Story:** Sebagai pengguna, saya ingin semua teks dalam chat bubble dapat terbaca dengan jelas, sehingga saya dapat memahami respons AI tanpa kesulitan.

#### Acceptance Criteria

1. WHEN Chat_Bubble menampilkan teks panjang, THEN THE Chat_Interface SHALL mengatur word-wrap dan overflow sehingga semua teks terlihat
2. WHEN Chat_Bubble menampilkan konten markdown, THEN THE Chat_Interface SHALL merender markdown dengan benar tanpa memotong konten
3. WHEN Chat_Bubble menampilkan formula atau kode, THEN THE Chat_Interface SHALL menggunakan font monospace dan background yang kontras
4. WHEN Chat_Bubble menampilkan preview perubahan data, THEN THE Chat_Interface SHALL membatasi tinggi maksimal dan menyediakan scroll jika diperlukan
5. WHEN lebar layar berubah (responsive), THEN THE Chat_Bubble SHALL menyesuaikan lebar maksimal agar tetap terbaca

### Requirement 4: Eksekusi Perintah yang Konsisten

**User Story:** Sebagai pengguna, saya ingin semua jenis perintah dapat diterapkan dengan benar ke spreadsheet, sehingga hasil sesuai dengan yang saya minta.

#### Acceptance Criteria

1. WHEN Action_Object berisi tipe DATA_TRANSFORM dengan transformType valid, THEN THE Command_Executor SHALL menerapkan transformasi ke sel atau kolom yang ditargetkan
2. WHEN Action_Object berisi tipe CONDITIONAL_FORMAT dengan parameter lengkap, THEN THE Command_Executor SHALL menerapkan format kondisional ke range yang ditargetkan
3. WHEN Action_Object berisi tipe FIND_REPLACE dengan findValue dan replaceValue, THEN THE Command_Executor SHALL mengganti semua kemunculan teks yang sesuai
4. WHEN Action_Object berisi tipe FILTER_DATA dengan filterOperator dan filterValue, THEN THE Command_Executor SHALL memfilter data sesuai kondisi
5. WHEN Action_Object berisi tipe SORT_DATA dengan sortColumn dan sortDirection, THEN THE Command_Executor SHALL mengurutkan data sesuai parameter
6. WHEN eksekusi perintah gagal, THEN THE Command_Executor SHALL mengembalikan error dengan pesan yang menjelaskan penyebab kegagalan

### Requirement 5: Validasi Parameter Perintah

**User Story:** Sebagai pengguna, saya ingin sistem memvalidasi parameter perintah sebelum eksekusi, sehingga saya mendapat feedback jelas jika ada parameter yang kurang atau salah.

#### Acceptance Criteria

1. WHEN Action_Object dengan tipe DATA_TRANSFORM tidak memiliki transformType, THEN THE Command_Executor SHALL menolak perintah dan menampilkan pesan error yang jelas
2. WHEN Action_Object dengan tipe FIND_REPLACE tidak memiliki findValue atau replaceValue, THEN THE Command_Executor SHALL menolak perintah dan menampilkan pesan error yang jelas
3. WHEN Action_Object dengan tipe CONDITIONAL_FORMAT tidak memiliki conditionType atau formatStyle, THEN THE Command_Executor SHALL menolak perintah dan menampilkan pesan error yang jelas
4. WHEN Action_Object dengan tipe SORT_DATA tidak memiliki sortColumn atau sortDirection, THEN THE Command_Executor SHALL menolak perintah dan menampilkan pesan error yang jelas
5. WHEN Action_Object dengan tipe FILTER_DATA tidak memiliki filterOperator atau filterValue, THEN THE Command_Executor SHALL menolak perintah dan menampilkan pesan error yang jelas

### Requirement 6: Error Handling yang Informatif

**User Story:** Sebagai pengguna, saya ingin mendapat pesan error yang jelas dan actionable ketika terjadi kesalahan, sehingga saya tahu apa yang harus diperbaiki.

#### Acceptance Criteria

1. WHEN parsing respons AI gagal, THEN THE Error_Handler SHALL menampilkan toast notification dengan pesan yang menjelaskan masalah parsing
2. WHEN eksekusi perintah gagal karena parameter tidak valid, THEN THE Error_Handler SHALL menampilkan pesan yang menyebutkan parameter mana yang kurang atau salah
3. WHEN streaming respons AI terputus, THEN THE Error_Handler SHALL menampilkan pesan yang menjelaskan koneksi terputus dan menyarankan retry
4. WHEN AI API mengembalikan error (429, 402, 503), THEN THE Error_Handler SHALL menampilkan pesan yang sesuai dengan jenis error (rate limit, credit habis, service unavailable)
5. WHEN terjadi error yang tidak terduga, THEN THE Error_Handler SHALL mencatat error ke console dengan context lengkap untuk debugging

### Requirement 7: Streaming Respons yang Stabil

**User Story:** Sebagai pengguna, saya ingin melihat respons AI secara real-time tanpa error atau respons yang terpotong, sehingga pengalaman chat terasa smooth dan responsif.

#### Acceptance Criteria

1. WHEN AI mengirim respons dalam bentuk stream, THEN THE Stream_Handler SHALL mengakumulasi chunk secara incremental dan menampilkan ke UI
2. WHEN stream berisi JSON yang belum lengkap, THEN THE Stream_Handler SHALL menunggu chunk berikutnya sebelum parsing
3. WHEN stream selesai dengan marker [DONE], THEN THE Stream_Handler SHALL memproses fullText dan membuat ChatMessage final
4. WHEN stream terputus sebelum selesai, THEN THE Stream_Handler SHALL menangani error dan menampilkan pesan yang sudah diterima
5. WHEN buffer stream berisi multiple event lines, THEN THE Stream_Handler SHALL memproses setiap line secara terpisah

### Requirement 8: Konsistensi Format Action Object

**User Story:** Sebagai developer, saya ingin semua Action_Object mengikuti struktur yang konsisten, sehingga mudah untuk memproses dan maintain kode.

#### Acceptance Criteria

1. THE System_Prompt SHALL mendefinisikan struktur Action_Object yang wajib memiliki field "type"
2. THE System_Prompt SHALL mendefinisikan daftar lengkap parameter wajib untuk setiap tipe action
3. WHEN AI menghasilkan Action_Object, THEN THE Action_Object SHALL menyertakan semua parameter wajib sesuai tipe action
4. WHEN Action_Object berisi target, THEN THE target SHALL memiliki field "type" (cell/range/column/row) dan "ref"
5. WHEN Action_Object berisi changes preview, THEN THE changes SHALL berupa array dengan format { cellRef, before, after, type }

### Requirement 9: Testing dan Validasi

**User Story:** Sebagai developer, saya ingin memiliki test suite yang komprehensif untuk memastikan semua fungsi parsing dan eksekusi bekerja dengan benar.

#### Acceptance Criteria

1. THE AI_Response_Parser SHALL memiliki unit tests untuk semua strategi parsing (direct, extracted, regex, fallback)
2. THE Command_Executor SHALL memiliki unit tests untuk setiap tipe action yang didukung
3. THE Stream_Handler SHALL memiliki unit tests untuk berbagai skenario streaming (normal, incomplete, error)
4. THE Error_Handler SHALL memiliki unit tests untuk berbagai jenis error dan format pesan
5. THE System_Prompt SHALL divalidasi dengan sample requests untuk memastikan AI menghasilkan format yang benar
