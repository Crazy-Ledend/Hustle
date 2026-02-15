from asyncio import timeout
from django.shortcuts import render
from .models import Todo
from django.utils import timezone 
import subprocess
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required

import sys
# from code_editor import get_client_ip

@login_required
def index(request):
    if request.method == "POST":
        title = request.POST.get("title")
        if title:
            Todo.objects.create(
                user_id=1,
                title=title
            )

    todos = Todo.objects.filter(user_id=1).order_by("-created_at")

    recent_logs = (
        Todo.objects
        .filter(completed=True)
        .order_by("-completed_at")[:3]
    )

    due_qs = todos.filter(
        reminder_at__lte=timezone.now(),
        completed=False
    )

    due = list(due_qs.values("id", "title"))

    return render(request, "index.html", {
        "todos": todos,
        "due": due,
        "recent_logs": recent_logs
    })


@csrf_exempt
@login_required
def run_code(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST only"}, status=405)

    code = request.POST.get("code", "")
    lang = request.POST.get("lang", "python")

    try:
        if lang == "python":
            # if get_client_ip(request) != "YOUR_PUBLIC_IP":
            #     return JsonResponse({"error": "Unauthorized"}, status=403)
            
            import os

            env = os.environ.copy()
            env["PYTHONUTF8"] = "1"
            env["PYTHONIOENCODING"] = "utf-8"

            result = subprocess.run(
                ["python", "-c", code],
                capture_output=True,
                text=True,
                env=env,
                timeout=3
            )

            result = result.decoded("utf-8", errors="replace") if isinstance(result, bytes) else result
            # result = (output.stdout or output.stderr)
            # result = result.encode("utf-8", errors="replace").decode("utf-8")

        elif lang == "java":
            with open("Main.java", "w", encoding="utf-8") as f:
                f.write(code)

            compile_res = subprocess.run(
                ["javac", "Main.java"],
                capture_output=True,
                text=True,
                encoding="utf-8",
                timeout=3
            )

            if compile_res.returncode != 0:
                return JsonResponse({"output": compile_res.stderr})

            run_res = subprocess.run(
                ["java", "Main"],
                capture_output=True,
                text=True,
                timeout=3
            )

            return JsonResponse({"output": run_res.stdout or run_res.stderr})

        else:
            return JsonResponse({"error": "Unsupported language"}, status=400)

        return JsonResponse({
            "output": result.stdout or result.stderr
        })

    except subprocess.TimeoutExpired:
        return JsonResponse({"output": "⏱ Execution timed out"})

# @require_POST
# def complete_task(request, task_id):
#     todo = Todo.objects.get(id=task_id)
#     todo.completed = True
#     todo.completed_at = timezone.now()
#     todo.save()
#     return JsonResponse({"success": True})

@csrf_exempt
def toggle_task(request, task_id):
    todo = Todo.objects.get(id=task_id)
    todo.completed = not todo.completed
    todo.completed_at = timezone.now() if todo.completed else None
    todo.save()
    return JsonResponse({"ok": True})


def task_logs(request):
    completed_tasks = Todo.objects.filter(completed=True).order_by("-completed_at")
    return render(request, "logs.html", {
        "tasks": completed_tasks
    })

@require_POST
def delete_task(request, task_id):
    Todo.objects.filter(id=task_id).delete()
    return JsonResponse({"deleted": True})
