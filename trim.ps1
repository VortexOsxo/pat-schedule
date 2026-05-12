$file = 'e:\Program\Sites\pat-schedule\src\routes\+page.svelte'
$lines = Get-Content $file
$lines[0..662] | Set-Content $file
