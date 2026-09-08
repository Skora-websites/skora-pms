$p = Start-Process -FilePath "npm.cmd" -ArgumentList "run","dev","--","-p","3100" -WorkingDirectory "C:\Users\rajat\Herd\skoracare_old" -RedirectStandardOutput "C:\Users\rajat\Herd\skoracare_old\.next-dev.log" -RedirectStandardError "C:\Users\rajat\Herd\skoracare_old\.next-dev.err.log" -WindowStyle Hidden -PassThru
Write-Output "PID=$($p.Id)"
