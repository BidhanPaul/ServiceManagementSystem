{{- define "service-management.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "service-management.fullname" -}}
{{- printf "%s-%s" .Release.Name (include "service-management.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}
