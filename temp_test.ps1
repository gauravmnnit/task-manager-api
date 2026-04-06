# temp_test.ps1 - register a user, create a task, fetch tasks
$user = @{ name = 'cli user'; email = "cli.user.$((Get-Random)%10000)@example.com"; password = 'MyPass123' }
$res = Invoke-RestMethod -Uri 'http://localhost:3000/users' -Method POST -ContentType 'application/json' -Body (ConvertTo-Json $user)
Write-Output "REGISTERED:`n";
$res | ConvertTo-Json -Depth 5 | Write-Output
$token = $res.token
Write-Output "TOKEN: $token`n"
$task = @{ description = 'CLI created task' }
$created = Invoke-RestMethod -Uri 'http://localhost:3000/tasks' -Method POST -ContentType 'application/json' -Headers @{ Authorization = "Bearer $token" } -Body (ConvertTo-Json $task)
Write-Output "CREATED TASK:`n"
$created | ConvertTo-Json -Depth 5 | Write-Output
Write-Output "FETCH TASKS:`n"
$tasks = Invoke-RestMethod -Uri 'http://localhost:3000/tasks' -Method GET -Headers @{ Authorization = "Bearer $token" }
$tasks | ConvertTo-Json -Depth 5 | Write-Output
