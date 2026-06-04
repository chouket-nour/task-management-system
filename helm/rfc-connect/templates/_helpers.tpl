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

{{- define "rfc.dns.config" -}}
dnsPolicy: ClusterFirst
dnsConfig:
  searches:
    - {{ .Release.Namespace }}.svc.cluster.local
    - svc.cluster.local
    - cluster.local
{{- end }}

{{- define "rfc.init.mongodb" -}}
initContainers:
  - name: wait-mongodb
    image: groundnuty/k8s-wait-for:no-root-v1.7
    args:
      - "pod"
      - "-lapp=mongodb"
{{- end }}

{{- define "rfc.init.apigateway" -}}
initContainers:
  - name: wait-api-gateway
    image: groundnuty/k8s-wait-for:no-root-v1.7
    args:
      - "pod"
      - "-lapp=api-gateway"
{{- end }}