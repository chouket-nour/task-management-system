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

{{- define "rfc.init.mongodb" -}}
initContainers:
  - name: wait-mongodb
    image: busybox
    command:
      - sh
      - -c
      - until nc -z mongodb 27017; do echo "waiting for mongodb..."; sleep 2; done
{{- end }}

{{- define "rfc.init.apigateway" -}}
initContainers:
  - name: wait-api-gateway
    image: busybox
    command:
      - sh
      - -c
      - until nc -z api-gateway 5000; do echo "waiting for api-gateway..."; sleep 2; done
{{- end }}