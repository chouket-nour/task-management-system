{{- define "rfc.env.common" -}}
- name: JWT_SECRET
  valueFrom:
    secretKeyRef:
      name: rfc-secrets
      key: jwt-secret
- name: AUTH_SERVICE_URL
  value: {{ .Values.services.authUrl }}
- name: USER_SERVICE_URL
  value: {{ .Values.services.userUrl }}
- name: TASK_SERVICE_URL
  value: {{ .Values.services.taskUrl }}
- name: PROJECT_SERVICE_URL
  value: {{ .Values.services.projectUrl }}
- name: CONGE_SERVICE_URL
  value: {{ .Values.services.congeUrl }}
- name: NOTIF_SERVICE_URL
  value: {{ .Values.services.notifUrl }}
{{- end }}