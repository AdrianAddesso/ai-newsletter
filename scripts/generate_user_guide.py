from __future__ import annotations

import shutil
from pathlib import Path
from typing import Iterable

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
SCREENSHOTS = ROOT / "docs" / "user-guide" / "screenshots"
OUTPUT_DIR = ROOT / "output" / "pdf"
PUBLIC_PDF = ROOT / "frontend" / "public" / "guia-de-usuario-ai-newsletter.pdf"
OUTPUT_PDF = OUTPUT_DIR / "guia-de-usuario-ai-newsletter.pdf"

RED = colors.HexColor("#C8102E")
DARK_OAK = colors.HexColor("#2B1B15")
LIGHT_BLUE = colors.HexColor("#E8F3F8")
LIGHT_GREY = colors.HexColor("#F5F5F5")
MID_GREY = colors.HexColor("#666666")
WHITE = colors.white


def register_fonts() -> tuple[str, str]:
    font_dir = ROOT / "frontend" / "src" / "assets" / "fonts"
    regular = next(iter(sorted(font_dir.glob("*Book*.ttf"))), None)
    bold = next(iter(sorted(font_dir.glob("*Bold*.ttf"))), None)

    if regular is None or bold is None:
        return "Helvetica", "Helvetica-Bold"

    pdfmetrics.registerFont(TTFont("GuideBodyFont", str(regular)))
    pdfmetrics.registerFont(TTFont("GuideHeadingFont", str(bold)))
    return "GuideBodyFont", "GuideHeadingFont"


REGULAR_FONT, BOLD_FONT = register_fonts()
BASE_STYLES = getSampleStyleSheet()
STYLES = {
    "cover_title": ParagraphStyle(
        "CoverTitle",
        fontName=BOLD_FONT,
        fontSize=27,
        leading=31,
        textColor=WHITE,
        alignment=TA_CENTER,
        spaceAfter=8 * mm,
    ),
    "cover_subtitle": ParagraphStyle(
        "CoverSubtitle",
        fontName=REGULAR_FONT,
        fontSize=14,
        leading=19,
        textColor=WHITE,
        alignment=TA_CENTER,
    ),
    "h1": ParagraphStyle(
        "Heading1",
        fontName=BOLD_FONT,
        fontSize=21,
        leading=25,
        textColor=RED,
        spaceAfter=5 * mm,
        keepWithNext=True,
    ),
    "h2": ParagraphStyle(
        "Heading2",
        fontName=BOLD_FONT,
        fontSize=14,
        leading=18,
        textColor=DARK_OAK,
        spaceBefore=4 * mm,
        spaceAfter=2 * mm,
        keepWithNext=True,
    ),
    "body": ParagraphStyle(
        "Body",
        fontName=REGULAR_FONT,
        fontSize=10.5,
        leading=15,
        textColor=DARK_OAK,
        spaceAfter=2.5 * mm,
    ),
    "bullet": ParagraphStyle(
        "Bullet",
        parent=BASE_STYLES["BodyText"],
        fontName=REGULAR_FONT,
        fontSize=10.5,
        leading=15,
        leftIndent=5 * mm,
        firstLineIndent=-3 * mm,
        bulletIndent=1 * mm,
        textColor=DARK_OAK,
        spaceAfter=1.5 * mm,
    ),
    "caption": ParagraphStyle(
        "Caption",
        fontName=REGULAR_FONT,
        fontSize=8.5,
        leading=11,
        textColor=MID_GREY,
        alignment=TA_CENTER,
        spaceBefore=1.5 * mm,
        spaceAfter=4 * mm,
    ),
    "callout": ParagraphStyle(
        "Callout",
        fontName=REGULAR_FONT,
        fontSize=10,
        leading=14,
        textColor=DARK_OAK,
    ),
}


def p(text: str, style: str = "body") -> Paragraph:
    return Paragraph(text, STYLES[style])


def bullets(items: Iterable[str]) -> list[Paragraph]:
    return [Paragraph(f"• {item}", STYLES["bullet"]) for item in items]


def section(title: str, intro: str | None = None) -> list[object]:
    content: list[object] = [p(title, "h1")]
    if intro:
        content.append(p(intro))
    return content


def screenshot(filename: str, caption: str) -> list[object]:
    path = SCREENSHOTS / filename
    if not path.exists():
        return []

    image = Image(str(path))
    max_width = 176 * mm
    max_height = 102 * mm
    scale = min(max_width / image.imageWidth, max_height / image.imageHeight)
    image.drawWidth = image.imageWidth * scale
    image.drawHeight = image.imageHeight * scale
    return [KeepTogether([image, p(caption, "caption")])]


def callout(title: str, text: str) -> Table:
    table = Table(
        [[p(f"<b>{title}</b><br/>{text}", "callout")]],
        colWidths=[176 * mm],
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BLUE),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#8BB8C8")),
                ("LEFTPADDING", (0, 0), (-1, -1), 4 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 3 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3 * mm),
            ]
        )
    )
    return table


def role_table() -> Table:
    data = [
        [p("Rol", "callout"), p("Acceso principal", "callout")],
        [p("USER", "callout"), p("Crear y editar newsletters propios, usar plantillas y seguir estados.", "callout")],
        [p("FUNCTIONAL", "callout"), p("Revisar, aprobar, administrar templates y consultar analítica.", "callout")],
        [p("ADMIN", "callout"), p("Acceso integral, usuarios, templates, revisiones y configuración global.", "callout")],
    ]
    table = Table(data, colWidths=[34 * mm, 142 * mm], repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), RED),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("BACKGROUND", (0, 1), (-1, -1), LIGHT_GREY),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D7D7D7")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 2.5 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5 * mm),
            ]
        )
    )
    return table


def header_footer(canvas, doc) -> None:
    canvas.saveState()
    if doc.page > 1:
        width, height = A4
        canvas.setStrokeColor(colors.HexColor("#DDDDDD"))
        canvas.line(18 * mm, 16 * mm, width - 18 * mm, 16 * mm)
        canvas.setFont(REGULAR_FONT, 8)
        canvas.setFillColor(MID_GREY)
        canvas.drawString(18 * mm, 10 * mm, "AI Newsletter - Guía de usuario")
        canvas.drawRightString(width - 18 * mm, 10 * mm, f"Página {doc.page}")
    canvas.restoreState()


def build_story() -> list[object]:
    story: list[object] = []

    cover = Table(
        [[p("AI Newsletter", "cover_title")], [p("Guía de usuario", "cover_subtitle")],
         [Spacer(1, 8 * mm)], [p("Creación, edición, revisión y administración de newsletters", "cover_subtitle")]],
        colWidths=[190 * mm],
        rowHeights=[45 * mm, 18 * mm, 20 * mm, 45 * mm],
    )
    cover.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), RED), ("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
    story.extend([Spacer(1, 28 * mm), cover, Spacer(1, 16 * mm), p("Versión 1.0 - Junio de 2026", "caption"), PageBreak()])

    story.extend(section("1. Cómo usar esta guía", "Esta guía acompaña los flujos disponibles en la aplicación. Las opciones visibles dependen del rol y del estado del newsletter."))
    story.extend(bullets([
        "Abrí el menú del perfil en la barra superior para descargar esta guía en cualquier momento.",
        "Elegí <b>Recorrer esta página</b> para iniciar una explicación contextual de la pantalla actual.",
        "Los recorridos sólo señalan controles: nunca guardan, eliminan, aprueban ni envían información.",
        "Si una acción no aparece, verificá tu rol, la propiedad del newsletter y su estado.",
    ]))
    story.append(Spacer(1, 3 * mm))
    story.append(role_table())
    story.extend(screenshot("01-login.png", "Acceso a la plataforma mediante la sesión corporativa."))
    story.append(callout("Ayuda contextual", "Los recorridos pueden cerrarse y volver a iniciarse desde el menú de navegación. No se guarda progreso."))
    story.append(PageBreak())

    story.extend(section("2. Inicio y gestión de newsletters", "El dashboard centraliza los newsletters y muestra las acciones permitidas para cada fila."))
    story.extend(screenshot("02-dashboard.png", "Dashboard de newsletters: filtros, búsqueda, creación y acciones disponibles."))
    story.extend(bullets([
        "Usá <b>Todos</b> o <b>Pendientes</b> para acotar la lista.",
        "Buscá por título, autor, estado u otra información visible.",
        "La vista previa permite revisar el contenido sin entrar al editor.",
        "Editar sólo está disponible para borradores o newsletters con cambios solicitados y según propiedad o rol.",
        "Eliminar requiere confirmación. La acción no se puede deshacer desde la interfaz.",
        "Duplicar crea una copia con un título nuevo; crear nueva edición conserva la trazabilidad del contenido aprobado.",
    ]))
    story.append(callout("Estados", "Borrador y cambios solicitados permiten edición. En revisión queda bloqueado para el autor. Aprobado habilita exportación para roles autorizados."))
    story.append(PageBreak())

    story.extend(section("3. Crear un newsletter", "La creación comienza al seleccionar el botón 'Nuevo Newsletter' en la pantalla principal (Dashboard), el cual redirige a la librería de plantillas publicadas. Una vez seleccionada la plantilla, se mostrará un menu desplegable donde se permitirá seleccionar el brand-kit, y por último en la sección derecha de la pantalla el formulario para el contexto que recibirá la IA."))
    story.extend(screenshot("03-template-library.png", "Biblioteca de plantillas: filtros por orientación y área, búsqueda y selección del diseño."))
    story.append(p("Paso 1 - Elegir plantilla y brandkit", "h2"))
    story.extend(bullets([
        "Filtrá la biblioteca por orientación, área o nombre.",
        "Previsualizá el diseño antes de seleccionarlo.",
        "Elegí un brandkit activo para aplicar fuentes, colores y recursos autorizados.",
    ]))
    story.append(PageBreak())
    story.append(p("3.1 Completar el formulario", "h1"))
    story.extend(screenshot("04-create-newsletter.png", "Creación del newsletter: selección de plantilla y brandkit junto al formulario para la IA."))
    story.append(p("Paso 2 - Preparar el pedido para la IA", "h2"))
    story.extend(bullets([
        "Indicá tema, objetivo, audiencia, mensajes clave y tono.",
        "Agregá fechas, llamada a la acción, contacto y fuentes sólo cuando correspondan.",
        "Revisá enlaces y datos sensibles antes de generar.",
        "Si la generación falla, corregí los campos señalados y volvé a intentar; el error no crea envíos automáticos.",
    ]))
    story.append(PageBreak())

    story.extend(section("4. Editar contenido", "El editor separa la vista previa del panel de edición. Cada bloque se modifica de forma independiente."))
    story.extend(screenshot("05-edit-typography.png", "Edición de tipografía: el bloque seleccionado se actualiza desde el panel derecho."))
    story.append(PageBreak())
    story.append(p("4.1 Ajustes visuales y acciones", "h1"))
    story.extend(screenshot("06-edit-branding.png", "Edición visual: colores del brandkit, fondo, URL y acciones de regeneración o guardado."))
    story.extend(bullets([
        "Seleccioná un bloque directamente en la vista previa.",
        "Editá los campos disponibles; cada tipo de bloque puede mostrar controles diferentes.",
        "Elegí imágenes y recursos del brandkit cuando el bloque los admita.",
        "Usá regeneración de bloque para rehacer sólo una sección o regeneración completa para volver al formulario inicial.",
        "Guardá como borrador antes de salir. Enviar a revisión cambia el estado y bloquea la edición normal.",
        "Descartar cambia el estado del newsletter; confirmá que no necesitás continuar trabajando sobre esa versión.",
    ]))
    story.append(callout("Buenas prácticas", "Revisá nombres, fechas, enlaces y llamadas a la acción. La salida de IA debe ser validada por una persona antes de la aprobación."))
    story.append(PageBreak())

    story.extend(section("5. Revisiones y aprobación", "ADMIN y FUNCTIONAL acceden a la bandeja de revisiones. Cada newsletter puede aprobarse o devolverse con comentarios por bloque."))
    story.extend(screenshot("07-sent-to-review.png", "Newsletter enviado: el estado cambia a En revisión y queda visible en el dashboard."))
    story.extend(screenshot("08-review-inbox.png", "Bandeja de revisiones: búsqueda, estado y acceso a la revisión pendiente."))
    story.append(PageBreak())
    story.append(p("5.1 Comentar y decidir", "h1"))
    story.extend(screenshot("10-review-comment.png", "Carga de un comentario por bloque antes de solicitar cambios o aprobar."))
    story.extend(bullets([
        "Abrí una revisión para inspeccionar el newsletter completo.",
        "Seleccioná el bloque que necesita una observación y agregá el comentario pendiente.",
        "Para solicitar cambios debe existir al menos un comentario.",
        "Aprobar confirma que el contenido está listo para exportación.",
        "Los comentarios y transiciones quedan disponibles en el historial.",
    ]))
    story.append(PageBreak())

    story.append(p("5.2 Revisar observaciones", "h1"))
    story.extend(screenshot("13-reviewed-comment.png", "Comentario de revisión visible sobre el bloque correspondiente del newsletter."))
    story.extend(bullets([
        "Revisá cada observación antes de modificar el contenido.",
        "Seleccioná el bloque relacionado para aplicar el cambio solicitado.",
        "Guardá las correcciones y reenviá la nueva versión a revisión.",
    ]))
    story.append(PageBreak())

    story.extend(section("6. Duplicar y reutilizar", "Una nueva edición permite reutilizar un newsletter existente sin modificar la versión original."))
    story.extend(screenshot("14-duplicate-newsletter.png", "Creación de una nueva edición: definí un título para identificar la copia."))
    story.extend(bullets([
        "Duplicar crea un nuevo borrador independiente y solicita un título para identificarlo.",
        "Usá un nombre que permita diferenciar claramente la nueva edición.",
        "La copia puede editarse y recorrer nuevamente el circuito de revisión.",
    ]))
    story.append(PageBreak())

    story.append(p("6.1 Exportar un newsletter", "h1"))
    story.extend(screenshot("15-export-newsletter.png", "Newsletter aprobado en modo de solo lectura con sus formatos de exportación disponibles."))
    story.extend(bullets([
        "Revisá la vista final antes de descargar.",
        "Elegí JPG, PDF o EML cuando la opción esté habilitada para el newsletter.",
        "Guardá el archivo descargado en una ubicación autorizada.",
        "La plataforma no envía emails automáticamente.",
    ]))
    story.append(callout("Seguridad", "No compartas exportaciones que contengan información interna fuera de los canales aprobados por la organización."))
    story.append(PageBreak())

    story.extend(section("7. Templates", "Los templates definen la estructura reutilizable de los newsletters. ADMIN puede crear; ADMIN y FUNCTIONAL pueden revisar y editar según la pantalla."))
    story.extend(screenshot("11-template-structure.png", "Crear template: orientación, datos generales y definición de filas y columnas."))
    story.extend(screenshot("12-template-blocks.png", "Editar template: asignación de bloques a cada espacio y vista previa del resultado."))
    story.extend(bullets([
        "Desde el listado se puede buscar, previsualizar y abrir la edición.",
        "Al crear, definí la estructura de filas y columnas antes de asignar tipos de bloque.",
        "El selector de bloques muestra únicamente definiciones disponibles.",
        "Usá la vista previa para comprobar jerarquía, orientación y distribución.",
        "Eliminar un template requiere confirmación y puede afectar su disponibilidad futura, no newsletters ya generados.",
    ]))
    story.append(PageBreak())

    story.extend(section("8. Usuarios y permisos", "La administración de usuarios está disponible sólo para ADMIN."))
    story.extend(screenshot("16-users-list.png", "Listado administrativo: búsqueda, exportación, roles, estados y acciones sobre usuarios."))
    story.extend(bullets([
        "Buscá por nombre, apellido o email.",
        "Editar actualiza sus datos y permisos efectivos en próximos accesos.",
        "Eliminar requiere confirmación; no uses esta acción para resolver un problema temporal de acceso.",
        "Exportar genera un archivo con el listado visible. Tratá ese archivo como información interna.",
    ]))
    story.append(PageBreak())

    story.append(p("8.1 Agregar un usuario", "h1"))
    story.extend(screenshot("17-create-user.png", "Formulario de alta: nombre, apellido, email, rol y estado del nuevo usuario."))
    story.extend(bullets([
        "Completá todos los campos obligatorios con información validada.",
        "Asigná el menor rol necesario para las tareas de la persona.",
        "Mantené el estado Active sólo para usuarios que deban acceder a la plataforma.",
        "Corregí los mensajes de validación antes de guardar.",
    ]))
    story.append(callout("Roles", "No asignes ADMIN para resolver una necesidad puntual. Aplicá siempre el menor nivel de acceso necesario."))
    story.append(PageBreak())

    story.extend(section("9. Analítica y trazabilidad", "La sección de analítica permite consultar actividad, transiciones y comentarios de revisión."))
    story.extend(screenshot("22-analytics.png", "Historial de estados: indicadores, distribución, búsqueda, reporte y detalle de transiciones."))
    story.extend(bullets([
        "Usá los indicadores como resumen operativo, no como reemplazo de la revisión de contenido.",
        "Filtrá el historial y seleccioná un newsletter para ver sus cambios de estado.",
        "Abrí los comentarios asociados para comprender por qué se solicitó una modificación.",
        "Las fechas se muestran con la configuración regional de la aplicación.",
    ]))
    story.append(PageBreak())

    story.extend(section("10. Panel administrativo", "ADMIN administra la configuración global desde las pestañas de IA, materiales y branding."))
    story.append(p("Configuración de IA", "h2"))
    story.extend(bullets([
        "Configuración de IA: modelos y comandos utilizados por la generación. Modificá valores sólo con validación técnica.",
        "No ingreses credenciales, tokens ni documentos internos en campos de configuración o prompts.",
    ]))
    story.append(p("Materiales", "h2"))
    story.extend(screenshot("18-admin-assets.png", "Administración de assets: búsqueda, vista previa, tipo, fechas y acciones de edición o eliminación."))
    story.extend(bullets([
        "Creá assets con un nombre y tipo representativos.",
        "Revisá la vista previa antes de habilitar el recurso para su uso.",
        "Eliminá únicamente recursos que ya no deban estar disponibles.",
    ]))
    story.append(PageBreak())

    story.append(p("10.1 Crear un brandkit", "h1"))
    story.extend(screenshot("19-brandkits-list.png", "Listado de brandkits: estado, fechas y acceso a creación o edición."))
    story.extend(screenshot("20-create-brandkit.png", "Primer guardado del brandkit: información general antes de administrar recursos."))
    story.extend(bullets([
        "Definí el nombre y si será el brandkit activo.",
        "Guardá la información general para habilitar fuentes, colores y assets.",
        "Sólo un brandkit puede permanecer activo a la vez.",
    ]))
    story.append(PageBreak())

    story.append(p("10.2 Editar un brandkit", "h1"))
    story.extend(screenshot("21-edit-brandkit.png", "Edición del brandkit: información general, fuentes y paleta de colores."))
    story.extend(bullets([
        "Subí únicamente archivos de fuentes autorizados.",
        "Agregá colores corporativos con nombres y valores correctos.",
        "Administrá los assets asociados y guardá los cambios antes de salir.",
    ]))
    story.append(PageBreak())

    story.extend(section("11. Solución de problemas", "Ante un error, conservá el contexto de la operación sin copiar información sensible."))
    troubleshooting = [
        ("No aparece una acción", "Comprobá el rol, el estado del newsletter y si sos su creador."),
        ("La sesión expiró", "Volvé a iniciar sesión y repetí la navegación. No reenvíes formularios sin revisar sus datos."),
        ("No carga una lista", "Actualizá la página. Si continúa, registrá la sección y la hora aproximada del error."),
        ("Falló la generación", "Revisá los campos y enlaces. Reintentá una vez; si persiste, informá el mensaje visible."),
        ("No se descarga el PDF o la guía", "Permití descargas para el sitio y comprobá que el navegador no haya bloqueado el archivo."),
        ("El recorrido omite un paso", "El control puede no estar disponible en ese estado o para ese rol. El recorrido sólo incluye elementos visibles."),
    ]
    data = [[p("Situación", "callout"), p("Qué hacer", "callout")]] + [
        [p(issue, "callout"), p(action, "callout")] for issue, action in troubleshooting
    ]
    table = Table(data, colWidths=[53 * mm, 123 * mm], repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), RED),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D7D7D7")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_GREY]),
        ("LEFTPADDING", (0, 0), (-1, -1), 3 * mm),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
        ("TOPPADDING", (0, 0), (-1, -1), 2.5 * mm),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5 * mm),
    ]))
    story.append(table)
    story.append(Spacer(1, 6 * mm))
    story.append(callout("Al pedir soporte", "Indicá página, acción, estado y hora aproximada. Nunca adjuntes tokens, cookies, credenciales ni contenido confidencial."))

    return story


def generate() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_PDF.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(OUTPUT_PDF),
        pagesize=A4,
        rightMargin=17 * mm,
        leftMargin=17 * mm,
        topMargin=18 * mm,
        bottomMargin=22 * mm,
        title="AI Newsletter - Guía de usuario",
        author="AI Newsletter",
        subject="Guía operativa para usuarios, revisores y administradores",
    )
    doc.build(build_story(), onFirstPage=header_footer, onLaterPages=header_footer)
    shutil.copyfile(OUTPUT_PDF, PUBLIC_PDF)
    print(f"Generated {OUTPUT_PDF}")
    print(f"Published {PUBLIC_PDF}")


if __name__ == "__main__":
    generate()
