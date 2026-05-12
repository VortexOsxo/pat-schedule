$file = 'e:\Program\Sites\pat-schedule\src\routes\+page.svelte'
$content = Get-Content $file -Raw -Encoding UTF8

# 1. Replace avatar: tinted bg -> solid color
$content = $content -replace 'style="background: \{posColor\(emp\.position\)\}22; border-color: \{posColor\(emp\.position\)\}55;"', 'style="background:{posColor(emp.position)}; color:{posTextColor(emp.position)};"'

# 2. Replace li class: add left border color
$content = $content -replace '<li class="emp-card">', '<li class="emp-card" style="border-left-color:{posColor(emp.position)}">'

# 3. Replace emp-badge span with emp-pos span
$old = '<span class="emp-badge" style="background:{posColor\(emp\.position\)}22; color:{posColor\(emp\.position\)}; border-color:{posColor\(emp\.position\)}44;">[\r\n\t]+\{emp\.position\}[\r\n\t]+</span>'
$new = '<span class="emp-pos" style="color:{posColor(emp.position)}">{emp.position}</span>'
$content = $content -replace $old, $new

Set-Content $file -Value $content -Encoding UTF8 -NoNewline
Write-Host "Done"
