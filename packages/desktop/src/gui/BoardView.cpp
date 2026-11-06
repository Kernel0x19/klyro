#include "gui/BoardView.hpp"

#include <QGraphicsScene>
#include <QPainter>
#include <QMouseEvent>
#include <QWheelEvent>
#include <QResizeEvent>
#include <QPaintEvent>
#include <QPainterPath>
#include <QLineF>
#include <QScrollBar>
#include <cmath>
#include <QtMath>
#include <algorithm>

namespace {
const QRectF OUTPUT_PANEL(50, 20, 1400, 110);
const QRectF IC_PANEL(50, 150, 1400, 420);
const QRectF INPUT_PANEL(50, 590, 1400, 110);
const QColor BOARD_BLUE("#0ba5d7");
const QColor BOARD_BORDER("#0a8cb8");
const QColor BOARD_LABEL("#054358");
const QColor CHIP_BODY("#1a1a1a");
const QColor PIN_METAL("#a7b0bb");

void drawPanel(QPainter* p, const QRectF& r)
{
    p->setPen(QPen(BOARD_BORDER, 1));
    p->setBrush(BOARD_BLUE);
    p->drawRoundedRect(r, 12, 12);
}

void drawLed(QPainter* p, const QPointF& center, bool on, const QColor& onColor)
{
    p->setPen(QPen(QColor("#050505"), 1.4));
    p->setBrush(QColor("#171717"));
    p->drawEllipse(center, 6.2, 6.2);
    p->setPen(Qt::NoPen);
    p->setBrush(on ? onColor : QColor("#3f4144"));
    p->drawEllipse(center, 3.0, 3.0);
    if (on) {
        p->setPen(QPen(QColor(onColor.red(), onColor.green(), onColor.blue(), 120), 3));
        p->setBrush(Qt::NoBrush);
        p->drawEllipse(center, 7.5, 7.5);
    }
}
}

BoardView::BoardView(QWidget* parent) : QGraphicsView(parent)
{
    auto* scene = new QGraphicsScene(this);
    scene->setSceneRect(0, 0, 1500, 720);
    setScene(scene);

    setObjectName("BoardView");
    setFrameShape(QFrame::NoFrame);
    setRenderHint(QPainter::Antialiasing, true);
    setRenderHint(QPainter::TextAntialiasing, true);
    setViewportUpdateMode(QGraphicsView::MinimalViewportUpdate);
    setTransformationAnchor(QGraphicsView::AnchorUnderMouse);
    setResizeAnchor(QGraphicsView::AnchorViewCenter);
    setHorizontalScrollBarPolicy(Qt::ScrollBarAsNeeded);
    setVerticalScrollBarPolicy(Qt::ScrollBarAsNeeded);
    setDragMode(QGraphicsView::NoDrag);
    setMouseTracking(true);
    setFocusPolicy(Qt::StrongFocus);
}

void BoardView::setDarkTheme(bool dark)
{
    m_dark = dark;
    viewport()->update();
}

void BoardView::setPowerOn(bool on)
{
    m_powerOn = on;
    viewport()->update();
}

void BoardView::setSelectedSlot(int slot)
{
    m_selectedSlot = slot;
    viewport()->update();
}

void BoardView::setSlotPart(int slot, const QString& part)
{
    if (slot < 0 || slot >= m_slotParts.size()) return;
    m_slotParts[slot] = part;
    viewport()->update();
}

void BoardView::setInputState(int index, bool high)
{
    if (index < 0 || index >= m_inputs.size()) return;
    m_inputs[index] = high;
    viewport()->update();
}

void BoardView::setOutputState(int index, bool high)
{
    if (index < 0 || index >= m_outputs.size()) return;
    m_outputs[index] = high;
    viewport()->update();
}

void BoardView::setPanMode(bool enabled)
{
    m_panMode = enabled;
    setCursor(enabled ? Qt::OpenHandCursor : Qt::ArrowCursor);
}

void BoardView::zoomIn()
{
    m_userChangedZoom = true;
    scale(1.15, 1.15);
}

void BoardView::zoomOut()
{
    m_userChangedZoom = true;
    scale(1.0 / 1.15, 1.0 / 1.15);
}

void BoardView::fitBoard()
{
    resetTransform();
    fitInView(sceneRect(), Qt::KeepAspectRatio);
    // The web reference deliberately leaves generous black/white canvas margin.
    scale(0.84, 0.84);
    centerOn(sceneRect().center());
    m_userChangedZoom = false;
}

void BoardView::drawBackground(QPainter* painter, const QRectF& rect)
{
    const QColor background = m_dark ? QColor("#000000") : QColor("#ffffff");
    const QColor grid = m_dark ? QColor(255, 255, 255, 24) : QColor(0, 0, 0, 34);
    painter->fillRect(rect, background);
    painter->save();
    painter->setPen(Qt::NoPen);
    painter->setBrush(grid);
    constexpr int spacing = 20;
    const int left = qFloor(rect.left() / spacing) * spacing;
    const int top = qFloor(rect.top() / spacing) * spacing;
    for (int x = left; x <= rect.right(); x += spacing) {
        for (int y = top; y <= rect.bottom(); y += spacing) {
            painter->drawEllipse(QPointF(x, y), 1.0, 1.0);
        }
    }
    painter->restore();
}

void BoardView::drawForeground(QPainter* painter, const QRectF& rect)
{
    Q_UNUSED(rect);
    painter->save();
    painter->setRenderHint(QPainter::Antialiasing, true);
    drawBoard(painter);
    painter->restore();
}

void BoardView::drawBoard(QPainter* painter)
{
    drawPanel(painter, OUTPUT_PANEL);
    drawPanel(painter, IC_PANEL);
    drawPanel(painter, INPUT_PANEL);
    drawOutputPanel(painter);
    drawICPanel(painter);
    drawInputPanel(painter);
}

void BoardView::drawOutputPanel(QPainter* p)
{
    p->save();
    p->setPen(BOARD_LABEL);
    QFont title("Space Grotesk", 8, QFont::Bold);
    title.setLetterSpacing(QFont::AbsoluteSpacing, 1.0);
    p->setFont(title);
    p->drawText(QRectF(OUTPUT_PANEL.left() + 270, OUTPUT_PANEL.top() + 5, 400, 15), Qt::AlignCenter, "OUTPUT SECTION");

    QFont pinFont("Inter", 7, QFont::Bold);
    p->setFont(pinFont);
    for (int i = 0; i < 17; ++i) {
        const QString label = (i == 16) ? QStringLiteral("VCC") : QString::number(15 - i);
        const qreal x = OUTPUT_PANEL.left() + 35 + i * 42.0;
        p->drawText(QRectF(x - 12, OUTPUT_PANEL.top() + 29, 24, 12), Qt::AlignCenter, label);
        const bool high = (i < 16) ? (m_outputs[i] && m_powerOn) : m_powerOn;
        drawLed(p, QPointF(x, OUTPUT_PANEL.top() + 61), high, QColor("#ef4444"));
        p->setPen(QPen(QColor("#58636a"), 1));
        p->drawRoundedRect(QRectF(x - 2.2, OUTPUT_PANEL.top() + 77, 4.4, 10), 1, 1);
        p->setPen(BOARD_LABEL);
    }

    // Two small seven-segment readouts and the power pushbutton.
    p->setPen(QPen(QColor("#096d8f"), 2));
    p->setBrush(QColor("#18181b"));
    p->drawRoundedRect(QRectF(OUTPUT_PANEL.right() - 188, OUTPUT_PANEL.top() + 20, 88, 68), 6, 6);
    for (int i = 0; i < 2; ++i) {
        const QRectF digit(OUTPUT_PANEL.right() - 180 + i * 39, OUTPUT_PANEL.top() + 27, 34, 53);
        p->setPen(QPen(QColor("#292929"), 1));
        p->setBrush(QColor("#050505"));
        p->drawRoundedRect(digit, 3, 3);
        p->setPen(m_powerOn ? QColor("#ff3b30") : QColor("#292929"));
        QFont digitFont("DejaVu Sans Mono", 24, QFont::Bold);
        p->setFont(digitFont);
        p->drawText(digit, Qt::AlignCenter, "0");
    }
    const QPointF powerCenter(OUTPUT_PANEL.right() - 48, OUTPUT_PANEL.top() + 62);
    p->setPen(BOARD_LABEL);
    p->setFont(QFont("Inter", 7, QFont::Bold));
    p->drawText(QRectF(powerCenter.x() - 24, powerCenter.y() - 30, 48, 12), Qt::AlignCenter, "Power");
    p->setPen(QPen(QColor("#090909"), 2));
    p->setBrush(QColor("#202124"));
    p->drawEllipse(powerCenter, 17, 17);
    p->setPen(m_powerOn ? QColor("#39b980") : QColor("#767676"));
    p->setFont(QFont("Arial", 18, QFont::Bold));
    p->drawText(QRectF(powerCenter.x() - 14, powerCenter.y() - 15, 28, 30), Qt::AlignCenter, "⏻");
    p->restore();
}

void BoardView::drawICPanel(QPainter* p)
{
    p->save();
    for (int slot = 0; slot < 5; ++slot) {
        const qreal x = IC_PANEL.left() + 140 + slot * 250.0;
        const QRectF body(x, IC_PANEL.top() + 100, 90, 220);
        drawChip(p, slot, body);
    }
    p->restore();
}

void BoardView::drawChip(QPainter* p, int slotIndex, const QRectF& body)
{
    const bool selected = slotIndex == m_selectedSlot;
    const QColor border = selected ? QColor("#4f6ef7") : QColor("#090909");
    const int pinRows = 10; // Empty bases are 20-pin placeholders, like the reference board.
    const qreal rowSpacing = body.height() / pinRows;

    p->setFont(QFont("Inter", 6, QFont::Bold));
    for (int row = 0; row < pinRows; ++row) {
        const qreal cy = body.top() + rowSpacing * (row + 0.5);
        const QRectF leftLead(body.left() - 21, cy - 3.5, 21, 7);
        const QRectF rightLead(body.right(), cy - 3.5, 21, 7);
        p->setPen(QPen(QColor("#090909"), 0.8));
        p->setBrush(PIN_METAL);
        p->drawRect(leftLead);
        p->drawRect(rightLead);

        p->setPen(QPen(QColor("#101820"), 0.7));
        p->setBrush(QColor("#0b485d"));
        p->drawRoundedRect(QRectF(body.left() - 38, cy - 6, 15, 12), 1, 1);
        p->drawRoundedRect(QRectF(body.right() + 23, cy - 6, 15, 12), 1, 1);
        p->setPen(QColor("#f0f4f8"));
        p->drawText(QRectF(body.left() - 38, cy - 6, 15, 12), Qt::AlignCenter, QString::number(row + 1));
        p->drawText(QRectF(body.right() + 23, cy - 6, 15, 12), Qt::AlignCenter, QString::number(20 - row));
    }

    p->setPen(QPen(border, selected ? 3 : 2));
    p->setBrush(CHIP_BODY);
    p->drawRoundedRect(body, 7, 7);
    p->setPen(QPen(QColor("#050505"), 1));
    p->setBrush(QColor("#242424"));
    p->drawChord(QRectF(body.center().x() - 11, body.top() - 1, 22, 14), 180 * 16, 180 * 16);

    p->save();
    p->translate(body.center());
    p->rotate(90);
    p->setPen(QColor("#a1a1aa"));
    QFont chipFont("DejaVu Sans Mono", 8, QFont::Bold);
    chipFont.setLetterSpacing(QFont::AbsoluteSpacing, 1.2);
    p->setFont(chipFont);
    const QString chipText = m_slotParts.value(slotIndex).isEmpty()
        ? QString("IC BASE %1").arg(slotIndex + 1)
        : m_slotParts.value(slotIndex);
    p->drawText(QRectF(-100, -15, 200, 30), Qt::AlignCenter, chipText);
    p->restore();
}

void BoardView::drawInputPanel(QPainter* p)
{
    p->save();
    p->setPen(BOARD_LABEL);
    p->setFont(QFont("Space Grotesk", 8, QFont::Bold));
    p->drawText(QRectF(INPUT_PANEL.left() + 225, INPUT_PANEL.top() + 88, 240, 12), Qt::AlignCenter, "INPUT SECTION");
    p->drawText(QRectF(INPUT_PANEL.left() + 900, INPUT_PANEL.top() + 88, 180, 12), Qt::AlignCenter, "CLOCK SECTION");

    p->setFont(QFont("Inter", 7, QFont::Bold));
    for (int i = 0; i < 16; ++i) {
        const qreal x = INPUT_PANEL.left() + 35 + i * 42.0;
        p->drawText(QRectF(x - 11, INPUT_PANEL.top() + 70, 22, 12), Qt::AlignCenter, QString::number(15 - i));
        drawLed(p, QPointF(x, INPUT_PANEL.top() + 24), m_inputs[i], QColor("#fbbf24"));
        p->setPen(QPen(QColor("#050505"), 1));
        p->setBrush(QColor("#262626"));
        p->drawRoundedRect(QRectF(x - 4.5, INPUT_PANEL.top() + 39, 9, 23), 2, 2);
        p->setBrush(QColor("#eeeeee"));
        const qreal knobY = m_inputs[i] ? INPUT_PANEL.top() + 40 : INPUT_PANEL.top() + 51;
        p->drawRoundedRect(QRectF(x - 3.3, knobY, 6.6, 8), 1, 1);
        p->setPen(BOARD_LABEL);
    }

    // Ground terminal.
    const qreal gx = INPUT_PANEL.left() + 760;
    drawLed(p, QPointF(gx, INPUT_PANEL.top() + 24), false, QColor("#888888"));
    p->setPen(QPen(QColor("#5b6470"), 1.5));
    p->drawLine(QPointF(gx, INPUT_PANEL.top() + 33), QPointF(gx, INPUT_PANEL.top() + 57));
    p->drawLine(QPointF(gx - 5, INPUT_PANEL.top() + 57), QPointF(gx + 5, INPUT_PANEL.top() + 57));
    p->setPen(BOARD_LABEL);
    p->drawText(QRectF(gx - 20, INPUT_PANEL.top() + 70, 40, 12), Qt::AlignCenter, "GND");

    // Four manual clock terminals.
    const QStringList clockNames = {"10", "5", "1", "0.5"};
    for (int i = 0; i < clockNames.size(); ++i) {
        const qreal x = INPUT_PANEL.left() + 985 + i * 47.0;
        drawLed(p, QPointF(x, INPUT_PANEL.top() + 24), false, QColor("#ef4444"));
        p->setPen(QPen(QColor("#777f89"), 1.5));
        p->drawLine(QPointF(x, INPUT_PANEL.top() + 32), QPointF(x, INPUT_PANEL.top() + 57));
        p->setPen(BOARD_LABEL);
        p->drawText(QRectF(x - 18, INPUT_PANEL.top() + 70, 36, 12), Qt::AlignCenter, clockNames[i]);
    }

    // HIGH / LOW legend.
    p->setFont(QFont("Inter", 6, QFont::Bold));
    p->drawText(QRectF(INPUT_PANEL.left() + 1170, INPUT_PANEL.top() + 20, 45, 12), Qt::AlignCenter, "HIGH");
    p->drawText(QRectF(INPUT_PANEL.left() + 1220, INPUT_PANEL.top() + 20, 45, 12), Qt::AlignCenter, "LOW");
    drawLed(p, QPointF(INPUT_PANEL.left() + 1193, INPUT_PANEL.top() + 44), false, QColor("#777777"));
    drawLed(p, QPointF(INPUT_PANEL.left() + 1243, INPUT_PANEL.top() + 44), false, QColor("#777777"));

    // Generate-pulse button (visual only in this UI milestone).
    const QRectF pulse(INPUT_PANEL.right() - 170, INPUT_PANEL.top() + 30, 135, 52);
    p->setPen(QPen(QColor("#080808"), 2));
    p->setBrush(QColor("#18181b"));
    p->drawRoundedRect(pulse, 7, 7);
    p->setPen(QColor("#ef4444"));
    p->setFont(QFont("Arial", 14, QFont::Bold));
    p->drawText(QRectF(pulse.left() + 8, pulse.top(), 25, pulse.height()), Qt::AlignCenter, "∿");
    p->setPen(QColor("#d4d4d8"));
    p->setFont(QFont("DejaVu Sans Mono", 7, QFont::Bold));
    p->drawText(QRectF(pulse.left() + 34, pulse.top(), pulse.width() - 40, pulse.height()), Qt::AlignCenter, "GENERATE PULSE");
    p->restore();
}

int BoardView::slotAt(const QPointF& point) const
{
    if (!IC_PANEL.contains(point)) return -1;
    for (int slot = 0; slot < 5; ++slot) {
        const QRectF area(IC_PANEL.left() + 100 + slot * 250.0,
                          IC_PANEL.top() + 55, 155, 310);
        if (area.contains(point)) return slot;
    }
    return -1;
}

int BoardView::inputAt(const QPointF& point) const
{
    if (!INPUT_PANEL.contains(point)) return -1;
    if (point.y() < INPUT_PANEL.top() + 32 || point.y() > INPUT_PANEL.top() + 68) return -1;
    for (int i = 0; i < 16; ++i) {
        const qreal x = INPUT_PANEL.left() + 35 + i * 42.0;
        if (qAbs(point.x() - x) <= 14) return i;
    }
    return -1;
}

bool BoardView::pointInPowerButton(const QPointF& point) const
{
    const QPointF center(OUTPUT_PANEL.right() - 48, OUTPUT_PANEL.top() + 62);
    return QLineF(point, center).length() <= 19.0;
}

QRect BoardView::zoomOverlayRect() const
{
    return QRect(viewport()->width() - 48, viewport()->height() - 128, 38, 112);
}

void BoardView::paintEvent(QPaintEvent* event)
{
    QGraphicsView::paintEvent(event);
    QPainter p(viewport());
    const QRect box = zoomOverlayRect();
    p.setRenderHint(QPainter::Antialiasing, true);
    p.setPen(QPen(m_dark ? QColor("#343a40") : QColor("#d9dce6"), 1));
    p.setBrush(m_dark ? QColor("#1a1d27") : QColor("#f5f6fa"));
    p.drawRoundedRect(box, 7, 7);
    p.setPen(m_dark ? QColor("#d8dbea") : QColor("#52566b"));
    QFont f("Arial", 15, QFont::Normal);
    p.setFont(f);
    p.drawText(QRect(box.left(), box.top() + 2, box.width(), 32), Qt::AlignCenter, "+");
    p.drawText(QRect(box.left(), box.top() + 38, box.width(), 32), Qt::AlignCenter, "−");
    p.setFont(QFont("Arial", 12, QFont::Bold));
    p.drawText(QRect(box.left(), box.top() + 76, box.width(), 30), Qt::AlignCenter, "⌗");
}

void BoardView::mousePressEvent(QMouseEvent* event)
{
    const QPoint pos = event->position().toPoint();
    const QRect controls = zoomOverlayRect();
    if (event->button() == Qt::LeftButton && controls.contains(pos)) {
        const int dy = pos.y() - controls.top();
        if (dy < 37) zoomIn();
        else if (dy < 75) zoomOut();
        else fitBoard();
        event->accept();
        return;
    }

    if (event->button() == Qt::MiddleButton || (event->button() == Qt::LeftButton && m_panMode)) {
        m_panning = true;
        m_lastPanPoint = pos;
        setCursor(Qt::ClosedHandCursor);
        event->accept();
        return;
    }

    if (event->button() == Qt::LeftButton) {
        const QPointF scenePoint = mapToScene(pos);
        if (pointInPowerButton(scenePoint)) {
            m_powerOn = !m_powerOn;
            emit powerToggled(m_powerOn);
            viewport()->update();
            event->accept();
            return;
        }
        const int input = inputAt(scenePoint);
        if (input >= 0) {
            m_inputs[input] = !m_inputs[input];
            emit inputToggled(input, m_inputs[input]);
            viewport()->update();
            event->accept();
            return;
        }
        const int slot = slotAt(scenePoint);
        if (slot >= 0) {
            m_selectedSlot = slot;
            emit slotClicked(slot);
            viewport()->update();
            event->accept();
            return;
        }
    }
    QGraphicsView::mousePressEvent(event);
}

void BoardView::mouseMoveEvent(QMouseEvent* event)
{
    if (m_panning) {
        m_userChangedZoom = true;
        const QPoint current = event->position().toPoint();
        const QPoint delta = current - m_lastPanPoint;
        m_lastPanPoint = current;
        horizontalScrollBar()->setValue(horizontalScrollBar()->value() - delta.x());
        verticalScrollBar()->setValue(verticalScrollBar()->value() - delta.y());
        event->accept();
        return;
    }
    QGraphicsView::mouseMoveEvent(event);
}

void BoardView::mouseReleaseEvent(QMouseEvent* event)
{
    if (m_panning && (event->button() == Qt::MiddleButton || event->button() == Qt::LeftButton)) {
        m_panning = false;
        setCursor(m_panMode ? Qt::OpenHandCursor : Qt::ArrowCursor);
        event->accept();
        return;
    }
    QGraphicsView::mouseReleaseEvent(event);
}

void BoardView::wheelEvent(QWheelEvent* event)
{
    if (event->modifiers().testFlag(Qt::ControlModifier)) {
        const qreal factor = std::pow(1.15, event->angleDelta().y() / 120.0);
        m_userChangedZoom = true;
        scale(factor, factor);
        event->accept();
        return;
    }
    QGraphicsView::wheelEvent(event);
}

void BoardView::resizeEvent(QResizeEvent* event)
{
    QGraphicsView::resizeEvent(event);
    if (!m_userChangedZoom && viewport()->width() > 0 && viewport()->height() > 0) {
        fitBoard();
    }
}
