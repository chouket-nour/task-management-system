{{- define "rfc.env.common" -}}
- name: JWT_SECRET
  valueFrom:
    secretKeyRef:
      name: rfc-secrets
      key: jwt-secret
- name: MONGO_URI_AUTH
  value: {{ .Values.mongo.uriAuth }}
- name: MONGO_URI_USER
  value: {{ .Values.mongo.uriUser }}
- name: MONGO_URI_TASK
  value: {{ .Values.mongo.uriTask }}
- name: MONGO_URI_PROJECT
  value: {{ .Values.mongo.uriProject }}
- name: MONGO_URI_CONGE
  value: {{ .Values.mongo.uriConge }}
- name: MONGO_URI_NOTIF
  value: {{ .Values.mongo.uriNotif }}
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
- name: NOTIFICATION_SERVICE_URL
  value: {{ .Values.services.notifUrl }}
{{- end }}