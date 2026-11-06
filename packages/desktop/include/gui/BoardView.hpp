#pragma once

#include <QGraphicsView>
#include <QVector>
#include <QStringList>
#include <QPoint>
#include <QPointF>

class QMouseEvent;
class QWheelEvent;
class QResizeEvent;
class QPainter;

class BoardView final : public QGraphicsView {
    Q_OBJECT
public:
    explicit BoardView(QWidget* parent = nullptr);

    void setDarkTheme(bool dark);
    void setPowerOn(bool on);
    void setSelectedSlot(int slot);
    void setSlotPart(int slot, const QString& part);
    void setInputState(int index, bool high);
    void setOutputState(int index, bool high);
    void setPanMode(bool enabled);

    void zoomIn();
    void zoomOut();
    void fitBoard();

signals:
    void slotClicked(int slotIndex);
    void inputToggled(int inputIndex, bool newState);
    void powerToggled(bool newState);
    void pinClicked(int slotIndex, int pinNumber);

protected:
    void drawBackground(QPainter* painter, const QRectF& rect) override;
    void drawForeground(QPainter* painter, const QRectF& rect) override;
    void mousePressEvent(QMouseEvent* event) override;
    void mouseMoveEvent(QMouseEvent* event) override;
    void mouseReleaseEvent(QMouseEvent* event) override;
    void wheelEvent(QWheelEvent* event) override;
    void resizeEvent(QResizeEvent* event) override;
    void paintEvent(QPaintEvent* event) override;

private:
    void drawBoard(QPainter* painter);
    void drawOutputPanel(QPainter* painter);
    void drawICPanel(QPainter* painter);
    void drawInputPanel(QPainter* painter);
    void drawChip(QPainter* painter, int slotIndex, const QRectF& body);
    int slotAt(const QPointF& scenePoint) const;
    int inputAt(const QPointF& scenePoint) const;
    bool pointInPowerButton(const QPointF& scenePoint) const;
    QRect zoomOverlayRect() const;

    bool m_dark = true;
    bool m_powerOn = true;
    bool m_panMode = false;
    bool m_panning = false;
    bool m_userChangedZoom = false;
    int m_selectedSlot = -1;
    QPoint m_lastPanPoint;
    QVector<bool> m_inputs = QVector<bool>(16, false);
    QVector<bool> m_outputs = QVector<bool>(16, false);
    QStringList m_slotParts = {"", "", "", "", ""};
};
